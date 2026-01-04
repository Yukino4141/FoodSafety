// pages/ai-analyze/ai-analyze.js
const app = getApp();

Page({
  data: {
    // 当前激活的标签
    activeTab: 'manual',
    
    // 手动输入数据
    ingredientsText: '',
    targetUser: 'common',
    customDesc: '',
    
    // 照片相关数据
    selectedImage: '',
    ocrResult: '',
    editingOCR: false,
    
    // 分析状态
    analyzing: false,
    showResult: false,
    
    // 分析结果
    result: {
      score: 0,
      summary: '',
      suggestion: '',
      riskLevel: 0,
      riskLevelText: '',
      color: '#2ecc71',
      riskPercent: 0,
      targetUser: '',
      ingredients: [],
      details: []
    },
    
    // 历史记录
    history: [],
    
    // 目标用户映射
    targetUserMap: {
      'common': { text: '普通成人', icon: '👤' },
      'child': { text: '儿童', icon: '👶' },
      'elder': { text: '老人', icon: '👴' },
      'pregnant': { text: '孕妇', icon: '🤰' },
      'allergy': { text: '过敏体质', icon: '⚠️' },
      'health': { text: '健身人士', icon: '💪' }
    }
  },

  onLoad(options) {
    console.log('AI分析页面加载');
    this.loadHistory();
  },

  onShow() {
    // 页面显示时刷新历史记录
    this.loadHistory();
  },

  // 加载历史记录
  loadHistory() {
    const history = wx.getStorageSync('aiAnalysisHistory') || [];
    this.setData({
      history: history.slice(0, 10) // 只显示最近10条
    });
  },

  // 切换标签
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab;
    this.setData({
      activeTab: tab,
      selectedImage: '',
      ocrResult: ''
    });
  },

  // 配料输入
  onIngredientsInput(e) {
    this.setData({
      ingredientsText: e.detail.value
    });
  },

  // 选择目标用户
  selectTargetUser(e) {
    const user = e.currentTarget.dataset.user;
    this.setData({
      targetUser: user
    });
  },

  // 自定义描述输入
  onCustomDescInput(e) {
    this.setData({
      customDesc: e.detail.value
    });
  },

  // 选择图片（拍照或相册）
  selectImage() {
    const { activeTab } = this.data;
    
    wx.showActionSheet({
      itemList: activeTab === 'camera' ? ['拍照'] : ['从相册选择'],
      success: (res) => {
        const sourceType = activeTab === 'camera' ? ['camera'] : ['album'];
        
        wx.chooseImage({
          count: 1,
          sizeType: ['compressed'],
          sourceType: sourceType,
          success: (res) => {
            const tempFilePath = res.tempFilePaths[0];
            console.log('选择的图片:', tempFilePath);
            
            this.setData({
              selectedImage: tempFilePath
            });
            
            // 自动进行OCR识别
            this.performOCR(tempFilePath);
          },
          fail: (err) => {
            console.error('选择图片失败:', err);
            wx.showToast({
              title: '选择图片失败',
              icon: 'none'
            });
          }
        });
      }
    });
  },

  // 执行OCR识别
  async performOCR(imagePath) {
    wx.showLoading({
      title: '正在识别...',
      mask: true
    });

    try {
      // 调用后端的OCR接口
      const ocrResult = await app.request('/user/ai/ocr', 'POST', {
        image: imagePath
      }, false);

      console.log('OCR识别结果:', ocrResult);

      if (ocrResult && ocrResult.text) {
        this.setData({
          ocrResult: ocrResult.text
        });
        
        wx.showToast({
          title: '识别成功',
          icon: 'success'
        });
      } else {
        wx.showToast({
          title: '未识别到文字',
          icon: 'none'
        });
      }

    } catch (error) {
      console.error('OCR识别失败:', error);
      
      wx.showToast({
        title: error.message || '识别失败',
        icon: 'none'
      });
      
      // 识别失败时，允许手动输入
      this.setData({
        ocrResult: '识别失败，请手动输入配料...'
      });

    } finally {
      wx.hideLoading();
    }
  },

  // 编辑OCR结果
  editOCRResult() {
    wx.showModal({
      title: '编辑识别结果',
      content: '请修正识别错误的文字',
      editable: true,
      placeholderText: this.data.ocrResult,
      success: (res) => {
        if (res.confirm) {
          this.setData({
            ocrResult: res.content
          });
        }
      }
    });
  },

  // 清除图片
  clearImage() {
    this.setData({
      selectedImage: '',
      ocrResult: ''
    });
  },

  // 预览图片
  previewImage() {
    const { selectedImage } = this.data;
    if (selectedImage) {
      wx.previewImage({
        urls: [selectedImage]
      });
    }
  },

  // 从图片开始分析
  analyzeFromImage() {
    if (!this.data.ocrResult) {
      wx.showToast({
        title: '请先进行文字识别',
        icon: 'none'
      });
      return;
    }
    
    // 将OCR结果复制到手动输入框
    this.setData({
      activeTab: 'manual',
      ingredientsText: this.data.ocrResult
    });
  },

  // 开始分析
  async startAnalysis() {
    // 验证输入
    const { ingredientsText, targetUser, customDesc } = this.data;
    
    if (!ingredientsText.trim()) {
      wx.showToast({
        title: '请输入配料内容',
        icon: 'none'
      });
      return;
    }

    // 解析配料文本为数组
    const ingredients = this.parseIngredients(ingredientsText);
    
    if (ingredients.length === 0) {
      wx.showToast({
        title: '未识别到有效的配料',
        icon: 'none'
      });
      return;
    }

    this.setData({ analyzing: true });

    try {
      // 构建请求数据
      const requestData = {
        ingredients: ingredients,
        targetUser: this.data.targetUserMap[targetUser].text
      };

      // 如果有自定义描述，添加到请求中
      if (customDesc.trim()) {
        requestData.customDesc = customDesc.trim();
      }

      console.log('开始AI分析，请求数据:', requestData);

      // 调用AI分析接口
      const analysisResult = await app.request('/user/ai/analyze', 'POST', requestData);
      console.log('AI分析结果:', analysisResult);

      // 处理分析结果
      const processedResult = this.processAnalysisResult(analysisResult, targetUser);
      
      // 显示结果
      this.setData({
        result: processedResult,
        showResult: true,
        analyzing: false
      });

      // 保存到历史记录
      this.saveToHistory(processedResult, ingredientsText);

    } catch (error) {
      console.error('AI分析失败:', error);
      this.setData({ analyzing: false });
      
      wx.showModal({
        title: '分析失败',
        content: error.message || '网络请求失败，请稍后重试',
        showCancel: false
      });
    }
  },

  // 解析配料文本
  parseIngredients(text) {
    // 按行分割，过滤空行和无效内容
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => {
        // 过滤空行和太短的行（可能是噪声）
        return line.length > 1 && 
               !line.includes('配料') && 
               !line.includes('成分') &&
               !line.includes(':') &&
               !line.includes('：');
      })
      .slice(0, 20); // 限制最多20个配料
  },

  // 处理分析结果
  processAnalysisResult(result, targetUser) {
    const score = result.score || 0;
    const riskLevel = result.riskLevel || 0;
    
    // 根据分数和风险等级确定颜色
    let color = '#2ecc71'; // 安全 - 绿色
    let riskPercent = 0;
    let riskLevelText = '安全';
    
    if (riskLevel === 1) {
      color = '#f1c40f'; // 注意 - 黄色
      riskPercent = 33;
      riskLevelText = '注意';
    } else if (riskLevel === 2) {
      color = '#e74c3c'; // 警告 - 红色
      riskPercent = 66;
      riskLevelText = '警告';
    } else if (riskLevel >= 3) {
      color = '#c0392b'; // 危险 - 深红
      riskPercent = 100;
      riskLevelText = '危险';
    } else {
      // 安全级别，根据分数调整百分比
      riskPercent = Math.max(0, 100 - score);
    }
    
    // 处理配料分析
    const ingredients = (result.ingredientAnalysis || []).map(item => {
      const riskLevel = item.riskLevel || 0;
      return {
        name: item.name || '未知成分',
        desc: item.description || '',
        riskLevel: riskLevel,
        riskText: riskLevel === 0 ? '安全' : riskLevel === 1 ? '注意' : '风险'
      };
    });
    
    // 处理详细建议
    const details = result.details || [];
    if (result.suggestion && details.length === 0) {
      // 如果只有suggestion没有details，将suggestion按句分割
      details.push(...result.suggestion.split(/[。！？]/).filter(s => s.trim()));
    }
    
    return {
      score: score,
      summary: result.summary || (score >= 80 ? '推荐食用' : score >= 60 ? '适量食用' : '谨慎食用'),
      suggestion: result.suggestion || '无具体建议',
      riskLevel: riskLevel,
      riskLevelText: riskLevelText,
      color: color,
      riskPercent: riskPercent,
      targetUser: this.data.targetUserMap[targetUser].text,
      ingredients: ingredients,
      details: details.slice(0, 5) // 最多5条详细建议
    };
  },

  // 保存到历史记录
  saveToHistory(result, ingredientsText) {
    try {
      let history = wx.getStorageSync('aiAnalysisHistory') || [];
      
      const historyItem = {
        id: Date.now(),
        targetUser: result.targetUser,
        score: result.score,
        summary: result.summary,
        time: this.formatTime(new Date()),
        tags: [
          { text: result.riskLevelText, class: result.riskLevel === 0 ? 'safe' : result.riskLevel === 1 ? 'warning' : 'danger' },
          { text: result.targetUser, class: 'info' }
        ],
        rawData: result,
        ingredients: ingredientsText
      };
      
      // 添加到开头
      history.unshift(historyItem);
      
      // 限制最多保存20条
      if (history.length > 20) {
        history = history.slice(0, 20);
      }
      
      wx.setStorageSync('aiAnalysisHistory', history);
      
      // 更新页面显示
      this.setData({
        history: history.slice(0, 10)
      });
      
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  },

  // 查看历史记录详情
  viewHistoryDetail(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.history[index];
    
    if (item && item.rawData) {
      this.setData({
        result: item.rawData,
        showResult: true
      });
    }
  },

  // 清空历史记录
  clearHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有历史记录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('aiAnalysisHistory');
          this.setData({
            history: []
          });
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 关闭结果弹窗
  closeResult() {
    this.setData({
      showResult: false
    });
  },

  // 保存结果
  saveResult() {
    const { result } = this.data;
    
    // 这里可以实现保存到本地或服务器的功能
    wx.showToast({
      title: '已保存',
      icon: 'success'
    });
    
    this.closeResult();
  },

  // 分享结果
  shareResult() {
    const { result } = this.data;
    
    // 设置分享内容
    return {
      title: `AI健康分析 - ${result.score}分`,
      path: `/pages/ai-analyze/ai-analyze`,
      imageUrl: '/assets/images/share-ai.jpg'
    };
  },

  // 格式化时间
  formatTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / (1000 * 60));
    const diffHour = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDay = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDay > 0) {
      return `${diffDay}天前`;
    } else if (diffHour > 0) {
      return `${diffHour}小时前`;
    } else if (diffMin > 0) {
      return `${diffMin}分钟前`;
    } else {
      return '刚刚';
    }
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: 'AI健康分析 - 智能分析食品配料',
      path: '/pages/ai-analyze/ai-analyze'
    };
  },

  onShareTimeline() {
    return {
      title: 'AI健康分析，守护你的饮食安全'
    };
  }
});