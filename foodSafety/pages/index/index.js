// pages/index/index.js
const app = getApp();

Page({
  data: {
    // 用户相关
    userInfo: null,
    isLoggedIn: false,
    showLoginPopup: false,
    currentTime: '',
    
    // 页面状态
    loading: false,
    scanning: false,
    refreshing: false,
    
    // 扫描历史
    recentScans: [],
    historyEmpty: true,
    
    // 统计信息
    stats: {
      totalScan: 0,
      riskCount: 0,
      safeCount: 0,
      todayScan: 0
    },
    
    // 功能入口
    features: [
      {
        id: 1,
        icon: '/assets/icons/ingredient.png',
        title: '配料速查',
        desc: '添加剂风险字典',
        url: '/pages/ingredients/ingredients',
        color: '#2ecc71'
      },
      {
        id: 2,
        icon: '/assets/icons/history.png',
        title: '我的冰箱',
        desc: '保质期管理',
        url: '/pages/inventory/inventory',
        color: '#3498db'
      },
      {
        id: 3,
        icon: '/assets/icons/community.png',  // 社区图标
        title: '食安社区',
        desc: '分享食品安全经验',
        url: '/pages/community/community',
        color: '#e74c3d'
      },
      {
        id: 4,
        icon: '/assets/icons/news.png',
        title: '食安科普',
        desc: '每日知识更新',
        url: '/pages/knowledge/knowledge',
        color: '#e67e22'
      },
      {
        id: 5,
        icon: '/assets/icons/setting.png',  // 偏好设置
        title: '偏好设置',
        desc: '过敏原管理',
        url: '/pages/preference/preference',
        color: '#9b59b6'
      },
      {
        id: 6,
        icon: '/assets/icons/ai.png',  
        title: 'AI健康分析',
        desc: '配料表智能分析',
        url: '/pages/ai-analyze/ai-analyze', 
        color: '#1abc9c'
      }
    ],
    
    // 热门搜索
    hotSearches: [
      '薯片', '饼干', '牛奶', '饮料'
    ],
    
    // 搜索框
    searchKeyword: '',
    showSearchHistory: false,
    searchHistory: [],
    
    // 系统信息
    statusBarHeight: 20,
    capsuleInfo: null
  },

  onLoad(options) {
    console.log('首页加载', options);
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 检查登录状态
    this.checkAuthStatus();
    
    // 加载数据
    this.loadInitialData();

    // 更新时间
    this.updateTime();
    this.timeInterval = setInterval(() => {
      this.updateTime();
    }, 60000); // 每分钟更新一次
    
    // 检查是否有启动参数
    if (options.scene === 1044) { // 扫码进入
      const q = decodeURIComponent(options.q || '');
      if (q.includes('barcode=')) {
        const barcode = q.split('barcode=')[1];
        this.handleScanResult(barcode);
      }
    }
  },

  onShow() {
    console.log('首页显示');
    // 每次显示时刷新数据
    this.checkAuthStatus();
    this.loadRecentScans();
    this.loadSearchHistory();
  },

  onPullDownRefresh() {
    console.log('下拉刷新');
    this.setData({ refreshing: true });
    
    // 同时刷新多个数据源
    Promise.all([
      this.loadRecentScans(),
      this.loadStats()
    ]).then(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
      wx.showToast({
        title: '刷新成功',
        icon: 'success',
        duration: 1000
      });
    }).catch(() => {
      wx.stopPullDownRefresh();
      this.setData({ refreshing: false });
    });
  },

  onShareAppMessage() {
    return {
      title: '食安卫士 - 守护您的食品安全',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-home.jpg'
    };
  },

  onShareTimeline() {
    return {
      title: '食安卫士 - 扫码识风险，安心享美食',
      query: '',
      imageUrl: '/assets/images/share-timeline.jpg'
    };
  },

  // ==================== 系统方法 ====================
  
  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      const menuButton = wx.getMenuButtonBoundingClientRect();
      
      this.setData({
        statusBarHeight: systemInfo.statusBarHeight || 20,
        capsuleInfo: {
          width: menuButton.width,
          height: menuButton.height,
          top: menuButton.top,
          right: menuButton.right,
          bottom: menuButton.bottom,
          left: menuButton.left
        }
      });
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
  },

  // ==================== 认证相关 ====================

  // 检查认证状态
  checkAuthStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo || { nickName: '食安卫士用户' }
      });
      app.globalData.token = token;
      app.globalData.isLoggedIn = true;
      console.log('已登录，用户:', userInfo?.nickName);
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null
      });
      app.globalData.isLoggedIn = false;
      console.log('未登录');
    }
  },

  // 显示登录弹窗
  showLoginPopup() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '登录提示',
        content: '需要登录才能使用完整功能',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/login/login'
            });
          }
          resolve(res.confirm);
        }
      });
    });
  },

  // 检查登录状态，未登录则提示
  requireLogin() {
    if (!this.data.isLoggedIn) {
      return this.showLoginPopup();
    }
    return Promise.resolve(true);
  },

  // ==================== 数据加载 ====================

  // 加载初始数据
  loadInitialData() {
    // 加载最近扫描记录
    this.loadRecentScans();
    
    // 加载统计信息
    this.loadStats();
    
    // 加载搜索历史
    this.loadSearchHistory();
  },

  // 加载最近扫描记录
  async loadRecentScans() {
    try {
      // 先检查登录状态
      if (!this.data.isLoggedIn) {
        // 未登录，使用本地存储的记录作为后备
        const localHistory = wx.getStorageSync('localScanHistory') || [];
        this.setData({
          recentScans: localHistory.slice(0, 5),
          historyEmpty: localHistory.length === 0
        });
        console.log('未登录，使用本地历史记录:', localHistory.length);
        return;
      }

      // 已登录，从服务器获取历史记录
      console.log('开始从服务器获取扫描历史');
      const history = await app.getScanHistory();
      console.log('获取到历史记录:', history.length, '条');
      
      // 格式化历史记录显示
      const formattedHistory = history.slice(0, 5).map(item => {
        return {
          id: item.id,
          name: item.name || '未知商品',
          image: item.image || '/assets/images/default-food.png',
          safetyStatus: item.safetyStatus || 'SAFE',
          riskMsg: item.riskMsg,
          barcode: item.barcode,
          scanTime: item.displayTime || this.formatTime(item.updateTime, 'MM-DD HH:mm'),
          fullTime: this.formatTime(item.updateTime),
          // 保留原始数据，用于后续操作
          rawData: item
        };
      });
      
      this.setData({
        recentScans: formattedHistory,
        historyEmpty: formattedHistory.length === 0
      });
      
      // 同时保存到本地作为缓存
      if (formattedHistory.length > 0) {
        wx.setStorageSync('localScanHistory', formattedHistory);
      }
      
    } catch (error) {
      console.error('加载历史记录失败:', error);
      
      // 失败时使用本地记录作为后备
      const localHistory = wx.getStorageSync('localScanHistory') || [];
      this.setData({
        recentScans: localHistory.slice(0, 5),
        historyEmpty: localHistory.length === 0
      });
      
      // 错误处理
      const errorMsg = error.message || error;
      if (errorMsg.includes('请先登录') || errorMsg.includes('登录已过期')) {
        // 登录相关错误，不提示用户，因为已经使用本地记录
        console.log('登录相关错误，已使用本地记录');
      } else {
        // 其他错误才提示
        wx.showToast({
          title: '加载历史记录失败',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  // 加载统计信息
  async loadStats() {
    try {
      if (!this.data.isLoggedIn) {
        // 未登录，使用本地数据
        const localHistory = wx.getStorageSync('localScanHistory') || [];
        const today = new Date().toDateString();
        const todayScans = localHistory.filter(item => {
          const scanDate = new Date(item.scanTime || item.fullTime).toDateString();
          return scanDate === today;
        });
        
        const riskCount = localHistory.filter(item => 
          item.safetyStatus === 'RISK' || item.safetyStatus === 'DANGER'
        ).length;
        
        this.setData({
          stats: {
            totalScan: localHistory.length,
            riskCount: riskCount,
            safeCount: localHistory.length - riskCount,
            todayScan: todayScans.length
          }
        });
        return;
      }

      // 已登录，从服务器获取历史记录并计算统计
      const history = await app.getScanHistory();
      const today = new Date().toDateString();
      
      const todayScans = history.filter(item => {
        try {
          const scanDate = new Date(item.updateTime).toDateString();
          return scanDate === today;
        } catch (e) {
          return false;
        }
      });
      
      const riskCount = history.filter(item => 
        item.safetyStatus === 'RISK' || item.safetyStatus === 'DANGER'
      ).length;
      
      this.setData({
        stats: {
          totalScan: history.length,
          riskCount: riskCount,
          safeCount: history.length - riskCount,
          todayScan: todayScans.length
        }
      });
      
    } catch (error) {
      console.error('加载统计信息失败:', error);
      
      // 使用默认值
      const localHistory = wx.getStorageSync('localScanHistory') || [];
      const today = new Date().toDateString();
      const todayScans = localHistory.filter(item => {
        try {
          const scanDate = new Date(item.scanTime || item.fullTime).toDateString();
          return scanDate === today;
        } catch (e) {
          return false;
        }
      });
      
      const riskCount = localHistory.filter(item => 
        item.safetyStatus === 'RISK' || item.safetyStatus === 'DANGER'
      ).length;
      
      this.setData({
        stats: {
          totalScan: localHistory.length,
          riskCount: riskCount,
          safeCount: localHistory.length - riskCount,
          todayScan: todayScans.length
        }
      });
    }
  },

  // 加载搜索历史
  loadSearchHistory() {
    const searchHistory = wx.getStorageSync('searchHistory') || [];
    this.setData({
      searchHistory: searchHistory.slice(0, 8)
    });
  },

  // ==================== 扫码功能 ====================

  // 扫码按钮点击
  async handleScan() {
    console.log('开始扫码');
    
    // 检查登录状态
    const canProceed = await this.requireLogin();
    if (!canProceed) return;
    
    this.setData({ scanning: true });
    
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode', 'qrCode'],
      success: (res) => {
        console.log('扫码成功:', res);
        this.handleScanResult(res.result);
      },
      fail: (err) => {
        console.error('扫码失败:', err);
        this.handleScanError(err);
      },
      complete: () => {
        this.setData({ scanning: false });
      }
    });
  },

  // 处理扫码结果
  async handleScanResult(barcode) {
    console.log('处理扫码结果:', barcode);
    
    // 显示加载
    wx.showLoading({
      title: '查询中...',
      mask: true
    });
    
    try {
      // 调用扫码查询接口
      const product = await app.scanProduct(barcode);
      console.log('查询成功:', product);
      
      // 保存到本地历史（临时记录）
      this.saveToLocalHistory(product, barcode);
      
      // 跳转到详情页
      wx.navigateTo({
        url: `/pages/detail/detail?barcode=${barcode}`
      });
      
    } catch (error) {
      console.error('查询失败:', error);
      this.handleQueryError(error, barcode);
      
    } finally {
      wx.hideLoading();
    }
  },

  // 保存到本地历史
  saveToLocalHistory(productData, barcode) {
    try {
      let history = wx.getStorageSync('localScanHistory') || [];
      
      // 避免重复
      const existingIndex = history.findIndex(item => item.barcode === barcode);
      if (existingIndex > -1) {
        history.splice(existingIndex, 1);
      }
      
      const now = new Date();
      history.unshift({
        id: productData.id || Date.now(),
        name: productData.name || '未知商品',
        image: productData.image || '/assets/images/default-food.png',
        safetyStatus: productData.safetyStatus || 'SAFE',
        riskMsg: productData.riskMsg,
        barcode: barcode,
        scanTime: now.toISOString(),
        fullTime: this.formatTime(now)
      });
      
      // 限制最多保存50条
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
      
      wx.setStorageSync('localScanHistory', history);
      
      // 更新页面显示
      this.setData({
        recentScans: history.slice(0, 5),
        historyEmpty: false
      });
      
    } catch (error) {
      console.error('保存本地历史失败:', error);
    }
  },

  // 处理扫码错误
  handleScanError(err) {
    let errorMsg = '扫码失败';
    
    if (err.errMsg === 'scanCode:fail cancel') {
      errorMsg = '已取消扫码';
    } else if (err.errMsg.includes('camera')) {
      wx.showModal({
        title: '相机权限',
        content: '需要相机权限才能扫码，请在设置中开启权限',
        confirmText: '去设置',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.openSetting();
          }
        }
      });
      return;
    } else if (err.errMsg.includes('auth')) {
      errorMsg = '扫码权限被拒绝';
    }
    
    wx.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 2000
    });
  },

  // 处理查询错误 - 修改这部分
handleQueryError(error, barcode) {
  console.error('查询错误处理:', error);
  
  const errorMsg = error.message || error;
  
  if (errorMsg.includes('请先登录') || errorMsg.includes('登录已过期') || errorMsg.includes('token')) {
    // 登录相关错误
    wx.showModal({
      title: '登录提示',
      content: errorMsg,
      showCancel: false,
      success: () => {
        wx.navigateTo({
          url: '/pages/login/login'
        });
      }
    });
    
  } else if (errorMsg.includes('未收录')) {
    // 商品未收录
    wx.showModal({
      title: '商品未收录',
      content: errorMsg,
      confirmText: '去搜索',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/search/search?keyword=${barcode}`
          });
        }
      }
    });
    
  } else if (errorMsg.includes('网络') || errorMsg.includes('超时')) {
    // 网络错误
    wx.showModal({
      title: '网络错误',
      content: errorMsg,
      confirmText: '重试',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          this.handleScanResult(barcode);
        }
      }
    });
    
  } else {
    // 其他错误
    wx.showModal({
      title: '查询失败',
      content: errorMsg,
      showCancel: false
    });
  }
},


// 处理扫码结果 - 添加条形码验证
async handleScanResult(barcode) {
  console.log('处理扫码结果:', barcode);
  
  // 验证条形码格式
  const validation = this.validateBarcode(barcode);
  if (!validation.isValid) {
    wx.showToast({
      title: validation.message,
      icon: 'none',
      duration: 2000
    });
    return;
  }
  
  const cleanBarcode = validation.barcode;
  
  // 显示加载
  wx.showLoading({
    title: '查询中...',
    mask: true
  });
  
  try {
    // 调用扫码查询接口
    const product = await app.scanProduct(cleanBarcode);
    console.log('查询成功:', product);
    
    // 保存到本地历史（临时记录）
    this.saveToLocalHistory(product, cleanBarcode);
    
    // 跳转到详情页
    wx.navigateTo({
      url: `/pages/detail/detail?barcode=${cleanBarcode}`
    });
    
  } catch (error) {
    console.error('查询失败:', error);
    this.handleQueryError(error, cleanBarcode);
    
  } finally {
    wx.hideLoading();
  }
},

// 新增：验证条形码格式
validateBarcode(barcode) {
  if (!barcode || typeof barcode !== 'string') {
    return { isValid: false, message: '条形码不能为空' };
  }
  
  // 移除空格和特殊字符
  const cleanBarcode = barcode.trim();
  
  if (cleanBarcode.length < 8 || cleanBarcode.length > 20) {
    return { isValid: false, message: '条形码长度应为8-20位' };
  }
  
  // 检查是否只包含数字（大多数条形码只包含数字）
  if (!/^\d+$/.test(cleanBarcode)) {
    return { isValid: false, message: '条形码应只包含数字' };
  }
  
  return { isValid: true, barcode: cleanBarcode };
},

  // ==================== 搜索功能 ====================

  // 搜索框输入
  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({
      searchKeyword: keyword,
      showSearchHistory: keyword.length === 0
    });
  },

  // 搜索框聚焦
  onSearchFocus() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      // 这里可以添加一些逻辑，但不再显示搜索历史
      // 或者直接跳转到搜索页
      wx.navigateTo({
        url: '/pages/search/search'
      });
    }
  },

  // 搜索框失去焦点
  onSearchBlur() {
    // 不需要延迟隐藏
    this.setData({
      showSearchHistory: false
    });
  },

  // 执行搜索
  onSearchConfirm(e) {
    const keyword = e.detail.value.trim() || this.data.searchKeyword.trim();
    if (!keyword) {
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.doSearch(keyword);
  },

  // 搜索按钮点击
  onSearchClick() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      // 跳转到搜索页
      wx.navigateTo({
        url: '/pages/search/search'
      });
    } else {
      this.doSearch(keyword);
    }
  },

  // 执行搜索
  doSearch(keyword) {
    // 保存搜索历史
    this.saveSearchHistory(keyword);
    
    // 跳转到搜索页
    wx.navigateTo({
      url: `/pages/search/search?keyword=${encodeURIComponent(keyword)}`
    });
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    let history = wx.getStorageSync('searchHistory') || [];
    
    // 移除重复项
    history = history.filter(item => item !== keyword);
    
    // 添加到开头
    history.unshift(keyword);
    
    // 限制数量
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    
    wx.setStorageSync('searchHistory', history);
    
    // 更新页面显示
    this.setData({
      searchHistory: history.slice(0, 8)
    });
  },

  // 清除搜索历史
  clearSearchHistory() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空搜索历史吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('searchHistory');
          this.setData({
            searchHistory: [],
            showSearchHistory: false
          });
          
          wx.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  },

  // 使用搜索历史
  useSearchHistory(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword,
      showSearchHistory: false
    }, () => {
      this.doSearch(keyword);
    });
  },

  // 热门搜索点击
  onHotSearch(e) {
    const keyword = e.currentTarget.dataset.keyword;
    this.setData({
      searchKeyword: keyword
    }, () => {
      this.doSearch(keyword);
    });
  },

  // ==================== 页面跳转 ====================

  // 跳转到功能页面
  goToFeature(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url: url
      });
    }
  },

  // 查看商品详情
  viewDetail(e) {
    const product = e.currentTarget.dataset;
    if (product.barcode) {
      wx.navigateTo({
        url: `/pages/detail/detail?barcode=${product.barcode}`
      });
    } else if (product.id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${product.id}`
      });
    }
  },

  // 跳转到历史记录页
  goToHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    });
  },

  // 跳转到个人中心
  goToProfile() {
    if (!this.data.isLoggedIn) {
      this.showLoginPopup();
      return;
    }
    
    wx.switchTab({
      url: '/pages/profile/profile'
    });
  },

  // 跳转到登录页
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    });
  },

  // ==================== 其他功能 ====================

  // 格式化时间
  formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hour = d.getHours();
      const minute = d.getMinutes();
      const second = d.getSeconds();

      const formatNumber = n => n.toString().padStart(2, '0');

      return format
        .replace('YYYY', year)
        .replace('MM', formatNumber(month))
        .replace('DD', formatNumber(day))
        .replace('HH', formatNumber(hour))
        .replace('mm', formatNumber(minute))
        .replace('ss', formatNumber(second));
    } catch (error) {
      console.error('格式化时间失败:', error, date);
      return String(date);
    }
  },

  // 复制条形码
  copyBarcode(e) {
    const barcode = e.currentTarget.dataset.barcode;
    if (barcode) {
      wx.setClipboardData({
        data: barcode,
        success: () => {
          wx.showToast({
            title: '条形码已复制',
            icon: 'success'
          });
        }
      });
    }
  },

  // 长按功能菜单
  onItemLongPress(e) {
    const product = e.currentTarget.dataset;
    wx.showActionSheet({
      itemList: ['复制条形码', '分享商品', '删除记录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: // 复制条形码
            if (product.barcode) {
              wx.setClipboardData({
                data: product.barcode,
                success: () => {
                  wx.showToast({
                    title: '条形码已复制',
                    icon: 'success'
                  });
                }
              });
            }
            break;
            
          case 1: // 分享商品
            this.shareProduct(product);
            break;
            
          case 2: // 删除记录
            this.deleteHistoryItem(product);
            break;
        }
      }
    });
  },

  // 分享商品
  shareProduct(product) {
    wx.showShareMenu({
      withShareTicket: true
    });
  },

  // 删除历史记录
  deleteHistoryItem(product) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${product.name}"的记录吗？`,
      success: (res) => {
        if (res.confirm) {
          // 从本地记录中删除
          let history = wx.getStorageSync('localScanHistory') || [];
          history = history.filter(item => item.barcode !== product.barcode);
          wx.setStorageSync('localScanHistory', history);
          
          // 更新页面显示
          this.setData({
            recentScans: history.slice(0, 5),
            historyEmpty: history.length === 0
          });
          
          wx.showToast({
            title: '已删除',
            icon: 'success'
          });
        }
      }
    });
  },
  // 更新时间方法
  updateTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const day = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
    
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    const dateStr = `${month}月${date}日 周${day}`;
    
    this.setData({
      currentTime: `${dateStr} ${timeStr}`
    });
  },

  // 刷新数据
  refreshData() {
    this.setData({ refreshing: true });
    
    Promise.all([
      this.loadRecentScans(),
      this.loadStats()
    ]).then(() => {
      wx.showToast({
        title: '刷新成功',
        icon: 'success'
      });
    }).finally(() => {
      this.setData({ refreshing: false });
    });
  },

  // 显示用户信息
  showUserInfo() {
    if (!this.data.isLoggedIn) {
      this.goToLogin();
      return;
    }
    
    
    
    wx.navigateTo({
      url: '/pages/profile/profile'
    });
  },

  // 关于页面
  goToAbout() {
    wx.navigateTo({
      url: '/pages/about/about'
    });
  },

  // 帮助页面
  goToHelp() {
    wx.navigateTo({
      url: '/pages/help/help'
    });
  },

  // 反馈页面
  goToFeedback() {
    wx.navigateTo({
      url: '/pages/feedback/feedback'
    });
  },

  // 设置页面
  goToSettings() {
    if (!this.data.isLoggedIn) {
      this.showLoginPopup();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/settings/settings'
    });
  }
});