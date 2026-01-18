// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    stats: {
      totalScan: 0,
      riskCount: 0,
      safeCount: 0,
      favoriteCount: 0
    },
    // 用户画像（健康档案）数据
    userProfile: {
      allergens: [],      // 过敏原
      dietType: '',       // 饮食偏好
      healthTags: []      // 健康标签
    },
    // 家庭成员列表
    familyMembers: [],
    // 当前选择的家庭成员（用于切换视角）
    currentMemberId: null,
    // 家庭成员编辑相关
    showAddFamily: false,
    editingMember: null,
    showMemberOptions: false,
    selectedMemberId: null,
    selectedMemberName: '',
    // 新增家庭成员表单数据
    newMember: {
      name: '',
      age: '',
      healthTags: []
    },
    // 可选择的健康标签（家庭成员专用）
    familyHealthTags: [
      { name: '乳糖不耐受', selected: false },
      { name: '麸质过敏', selected: false },
      { name: '食物过敏', selected: false },
      { name: '哮喘', selected: false },
      { name: '湿疹', selected: false },
      { name: '生长发育期', selected: false },
      { name: '孕期', selected: false },
      { name: '哺乳期', selected: false },
      { name: '老年人', selected: false },
      { name: '素食者', selected: false }
    ],
    // 可选择的选项数据
    selectOptions: {
      allergens: [
        { name: '花生', selected: false },
        { name: '芒果', selected: false },
        { name: '海鲜', selected: false },
        { name: '牛奶', selected: false },
        { name: '鸡蛋', selected: false },
        { name: '大豆', selected: false },
        { name: '坚果', selected: false },
        { name: '小麦', selected: false },
        { name: '芝麻', selected: false }
      ],
      dietTypes: [
        { name: '正常', value: '正常' },
        { name: '低糖', value: '低糖' },
        { name: '低盐', value: '低盐' },
        { name: '低脂', value: '低脂' },
        { name: '高蛋白', value: '高蛋白' },
        { name: '素食', value: '素食' },
        { name: '无麸质', value: '无麸质' },
        { name: '生酮', value: '生酮' }
      ],
      healthTags: [
        { name: '糖尿病', selected: false },
        { name: '高血压', selected: false },
        { name: '高血脂', selected: false },
        { name: '心脏病', selected: false },
        { name: '痛风', selected: false },
        { name: '肥胖', selected: false },
        { name: '肾脏病', selected: false },
        { name: '孕期', selected: false }
      ]
    },
    // 编辑状态控制
    editingProfile: false,
    tempProfile: {},
    memberDays: 45,
    isVip: false,
    vipExpireDate: '2024-12-31',
    showGuide: false,
    // 更新菜单项
    menuItems: [
      // {
      //   id: 1,
      //   text: '健康档案',
      //   desc: '设置饮食偏好和过敏信息',
      //   icon: '📋',
      //   color: 'green',
      //   event: 'editProfile',
      //   badge: 0
      // },
      {
        id: 2,
        text: '家庭成员',
        desc: '管理家人健康信息',
        icon: '👨‍👩‍👧‍👦',
        color: 'blue',
        event: 'showFamilyList',
        badge: 0
      },
      // {
      //   id: 3,
      //   text: '检测历史',
      //   desc: '查看所有检测记录',
      //   icon: '📚',
      //   color: 'orange',
      //   url: '/pages/history/history',
      //   badge: 3
      // },
      {
        id: 4,
        text: '我的收藏',
        desc: '收藏的安全商品',
        icon: '⭐',
        color: 'purple',
        url: '/pages/favorites/favorites'
      },
      // {
      //   id: 5,
      //   text: '购物清单',
      //   desc: '待购买商品清单',
      //   icon: '🛒',
      //   color: 'teal',
      //   url: '/pages/shopping/shopping',
      //   badge: 5
      // },
      // {
      //   id: 6,
      //   text: '意见反馈',
      //   desc: '帮助我们改进',
      //   icon: '💬',
      //   color: 'red',
      //   url: '/pages/feedback/feedback'
      // }
    ]
  },

  onShow() {
    this.checkLogin();
    this.loadUserStats();
    // 如果已登录，加载用户画像和家庭成员数据
    if (wx.getStorageSync('token')) {
      this.getUserProfile();
      this.getFamilyMembers();
    }
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo || { nickName: '食安卫士用户' }
      });
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null
      });
    }
  },
  
  // 去重历史记录方法
  deduplicateHistory(historyList) {
    if (!Array.isArray(historyList) || historyList.length === 0) {
      return [];
    }
    
    console.log('profile去重开始，原始数据条数:', historyList.length);
    
    // 使用Map来去重，key为商品ID + 条形码的组合
    const uniqueMap = new Map();
    
    historyList.forEach(item => {
      // 构建唯一标识符
      const key = this.generateHistoryKey(item);
      
      if (key) {
        const existingItem = uniqueMap.get(key);
        if (existingItem) {
          // 比较扫描时间，保留最新的
          const existingTime = this.parseDate(existingItem.updateTime || existingItem.scanTime);
          const currentTime = this.parseDate(item.updateTime || item.scanTime);
          
          if (currentTime > existingTime) {
            uniqueMap.set(key, item);
            console.log(`替换重复项: ${item.name} (${key})`);
          }
        } else {
          uniqueMap.set(key, item);
        }
      }
    });
    
    const deduplicatedList = Array.from(uniqueMap.values());
    console.log('profile去重完成，剩余条数:', deduplicatedList.length);
    
    return deduplicatedList;
  },

  // 生成历史记录的唯一键
  generateHistoryKey(item) {
    // 优先使用商品ID
    if (item.id || item.productId) {
      const productId = item.id || item.productId;
      return `id_${productId}`;
    }
    
    // 其次使用条形码
    if (item.barcode) {
      return `barcode_${item.barcode}`;
    }
    
    // 最后使用商品名称（可能不准确）
    if (item.name) {
      return `name_${item.name}`;
    }
    
    // 如果都没有，返回null
    console.warn('无法生成历史记录键，缺少标识信息:', item);
    return null;
  },

  // 解析日期字符串为时间戳
  parseDate(dateString) {
    if (!dateString) return 0;
    
    try {
      const date = new Date(dateString);
      return date.getTime();
    } catch (error) {
      console.error('解析日期失败:', error);
      return 0;
    }
  },

  // 加载用户统计
  async loadUserStats() {
    try {
      // 获取历史记录
      const history = await app.getScanHistory();
      console.log('个人主页获取到原始历史记录:', history.length, '条');
      
      // ========== 去重处理 ==========
      const deduplicatedHistory = this.deduplicateHistory(history);
      console.log('个人主页去重后历史记录:', deduplicatedHistory.length, '条');
      
      // 统计风险商品数量
      const riskCount = deduplicatedHistory.filter(item => {
        // 使用安全状态判断，兼容不同的数据格式
        const safetyStatus = item.safetyStatus || item.safetyInfo?.status;
        return safetyStatus === 'RISK' || safetyStatus === 'DANGER' || 
              (item.riskLevel && item.riskLevel > 0) || 
              (item.hasRisk === true);
      }).length;
      
      // 统计安全商品数量
      const safeCount = deduplicatedHistory.length - riskCount;
      
      // 获取收藏数量
      const favorites = wx.getStorageSync('favorites') || [];
      
      this.setData({
        stats: {
          totalScan: deduplicatedHistory.length,
          riskCount: riskCount,
          safeCount: safeCount,
          favoriteCount: favorites.length
        }
      });
      
      console.log('个人主页统计数据:', this.data.stats);
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
      
      // 使用本地数据作为后备方案
      const localHistory = wx.getStorageSync('localScanHistory') || [];
      
      // 本地数据也要去重
      const deduplicatedLocalHistory = this.deduplicateHistory(localHistory);
      
      const localRiskCount = deduplicatedLocalHistory.filter(item => {
        const safetyStatus = item.safetyStatus || item.safetyInfo?.status;
        return safetyStatus === 'RISK' || safetyStatus === 'DANGER' || 
              (item.riskLevel && item.riskLevel > 0) || 
              (item.hasRisk === true);
      }).length;
      
      const favorites = wx.getStorageSync('favorites') || [];
      
      this.setData({
        stats: {
          totalScan: deduplicatedLocalHistory.length,
          riskCount: localRiskCount,
          safeCount: deduplicatedLocalHistory.length - localRiskCount,
          favoriteCount: favorites.length
        }
      });
      
      console.log('个人主页使用本地缓存统计数据:', this.data.stats);
    }
  },

  // 获取用户画像
  async getUserProfile() {
    try {
      wx.showLoading({ title: '加载中...', mask: true });
      
      const res = await app.request('/user/profile', 'GET');
      wx.hideLoading();
      console.log("profile",res);
      if (res !== undefined) {
        this.setData({
          userProfile: {
            allergens: res.allergens || [],
            dietType: res.dietType || '',
            healthTags: res.healthTags || []
          }
        });
        this.updateSelectOptions(res);
        
        // 更新菜单提示
        if (res.allergens && res.allergens.length > 0) {
          const menuItems = this.data.menuItems;
          menuItems[0].badge = 1;
          this.setData({ menuItems });
        }
      } else {
        this.setData({
          userProfile: {
            allergens: [],
            dietType: '',
            healthTags: []
          }
        });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('获取用户画像失败:', error);
      
      const localProfile = wx.getStorageSync('userProfile');
      if (localProfile) {
        this.setData({ userProfile: localProfile });
        this.updateSelectOptions(localProfile);
      }
    }
  },

  // 获取家庭成员列表
  async getFamilyMembers() {
    try {
      // 先尝试调用接口获取数据
      const res = await app.request('/user/family/list', 'GET');
      
    if (res !== undefined) {
        this.setData({
          familyMembers: res,
          // 设置默认当前成员（第一个或用户自己）
          currentMemberId: res[0]?.id || null
        });
        
        // 更新菜单提示
        const menuItems = this.data.menuItems;
        menuItems[1].badge = res.length > 0 ? res.length : 0;
        this.setData({ menuItems });
        
        // 保存到本地缓存
        wx.setStorageSync('familyMembers', res);
      } else {
        // 如果接口无数据，使用本地缓存
        const localMembers = wx.getStorageSync('familyMembers') || [];
        this.setData({
          familyMembers: localMembers,
          currentMemberId: localMembers[0]?.id || null
        });
      }
      
    } catch (error) {
      console.error('获取家庭成员失败:', error);
      
      // 使用本地缓存的数据
      const localMembers = wx.getStorageSync('familyMembers') || [];
      this.setData({
        familyMembers: localMembers,
        currentMemberId: localMembers[0]?.id || null
      });
    }
  },

  // 新增家庭成员（接口：POST /user/family）
  async addFamilyMember() {
    try {
      const { newMember } = this.data;
      
      // 验证必填字段
      if (!newMember.name.trim()) {
        wx.showToast({
          title: '请输入成员昵称',
          icon: 'none'
        });
        return;
      }

      wx.showLoading({ title: '添加中...', mask: true });

      // 构建请求参数
      const params = {
        name: newMember.name.trim(),
        age: newMember.age ? parseInt(newMember.age) : null,
        healthTags: newMember.healthTags
      };

      // 调用后端接口
      const res = await app.request('/user/family', 'POST', params);
      
      wx.hideLoading();

      if (res!==undefined) {
        // 添加成功，更新列表
        const updatedMembers = [...this.data.familyMembers, res.data];
        this.setData({
          familyMembers: updatedMembers,
          showAddFamily: false,
          newMember: {
            name: '',
            age: '',
            healthTags: []
          },
          // 重置标签选中状态
          'familyHealthTags': this.data.familyHealthTags.map(tag => ({
            ...tag,
            selected: false
          }))
        });

        // 保存到本地缓存
        wx.setStorageSync('familyMembers', updatedMembers);
        
        // 更新菜单提示
        const menuItems = this.data.menuItems;
        menuItems[1].badge = updatedMembers.length;
        this.setData({ menuItems });

        wx.showToast({
          title: '添加成功',
          icon: 'success',
          duration: 2000
        });

        // 发布成员更新事件
        // if (typeof this.getOpenerEventChannel === 'function') {
        //   const eventChannel = this.getOpenerEventChannel();
        //   eventChannel.emit('familyMembersUpdated', updatedMembers);
        // }
      } else {
        wx.showToast({
          title: res.msg || '添加失败',
          icon: 'none'
        });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('添加家庭成员失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    }
  },

  // 编辑家庭成员
  async editFamilyMember(e) {
    const memberId = e.currentTarget.dataset.id;
    const member = this.data.familyMembers.find(m => m.id === memberId);
    
    if (!member) return;
    
    // 初始化编辑表单
    const { familyHealthTags } = this.data;
    const updatedTags = familyHealthTags.map(tag => ({
      ...tag,
      selected: member.healthTags?.includes(tag.name) || false
    }));
    
    this.setData({
      showAddFamily: true,
      editingMember: member,
      newMember: {
        name: member.name,
        age: member.age?.toString() || '',
        healthTags: member.healthTags || []
      },
      familyHealthTags: updatedTags
    });
  },

  // 保存家庭成员编辑（更新）
  async saveFamilyMember() {
    try {
      const { editingMember, newMember } = this.data;
      
      // 验证必填字段
      if (!newMember.name.trim()) {
        wx.showToast({
          title: '请输入成员昵称',
          icon: 'none'
        });
        return;
      }

      wx.showLoading({ title: '保存中...', mask: true });

      // 构建请求参数
      const params = {
        name: newMember.name.trim(),
        age: newMember.age ? parseInt(newMember.age) : null,
        healthTags: newMember.healthTags
      };

      // 调用后端更新接口
      const res = await app.request(`/user/family/${editingMember.id}`, 'PUT', params);
      
      wx.hideLoading();

      if (res === 'success') {
        // 由于后端返回的data是"success"，我们需要重新获取列表
        await this.getFamilyMembers();
        
        // 重置表单
        this.setData({
          showAddFamily: false,
          editingMember: null,
          newMember: {
            name: '',
            age: '',
            healthTags: []
          },
          // 重置标签选中状态
          'familyHealthTags': this.data.familyHealthTags.map(tag => ({
            ...tag,
            selected: false
          }))
        });

        wx.showToast({
          title: '更新成功',
          icon: 'success',
          duration: 2000
        });
      } else {
        wx.showToast({
          title: res.msg || '更新失败',
          icon: 'none'
        });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('更新家庭成员失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    }
  },
  // 删除家庭成员
  async deleteFamilyMember(e) {
    const memberId = e.currentTarget.dataset.id;
    const memberName = e.currentTarget.dataset.name || '';
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除成员"${memberName}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...', mask: true });
            
            // 调用删除接口
            const deleteRes = await app.request(`/user/family/${memberId}`, 'DELETE');
            
            wx.hideLoading();
            
            if (deleteRes!== undefined) {
              // 从列表中移除
              const updatedMembers = this.data.familyMembers.filter(
                member => member.id !== memberId
              );
              
              this.setData({
                familyMembers: updatedMembers,
                // 如果删除的是当前选中的成员，重新选择第一个
                currentMemberId: this.data.currentMemberId === memberId 
                  ? (updatedMembers[0]?.id || null)
                  : this.data.currentMemberId
              });
              
              // 更新本地缓存
              wx.setStorageSync('familyMembers', updatedMembers);
              
              // 更新菜单提示
              const menuItems = this.data.menuItems;
              menuItems[1].badge = updatedMembers.length;
              this.setData({ menuItems });
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: deleteRes.msg || '删除失败',
                icon: 'none'
              });
            }
          } catch (error) {
            wx.hideLoading();
            console.error('删除家庭成员失败:', error);
            wx.showToast({
              title: '网络异常，请稍后重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 切换当前家庭成员（切换视角）
  switchCurrentMember(e) {
    const memberId = e.currentTarget.dataset.id;
    
    if (memberId === this.data.currentMemberId) {
      return; // 已经是当前选中的，无需切换
    }
    
    this.setData({
      currentMemberId: memberId
    });
    
    wx.showToast({
      title: '已切换视角',
      icon: 'success',
      duration: 1500
    });
    
    // 存储当前选择的家庭成员到全局
    app.globalData.currentFamilyMember = this.data.familyMembers.find(
      member => member.id === memberId
    );
    
    // 发布切换事件，通知其他页面
    app.eventBus.emit('familyMemberSwitched', memberId);
  },

  // 显示添加家庭成员表单
  showAddFamilyForm() {
    this.setData({
      showAddFamily: true,
      editingMember: null,
      newMember: {
        name: '',
        age: '',
        healthTags: []
      }
    });
  },

  // 隐藏添加家庭成员表单
  hideAddFamilyForm() {
    this.setData({
      showAddFamily: false,
      newMember: {
        name: '',
        age: '',
        healthTags: []
      },
      // 重置标签选中状态
      'familyHealthTags': this.data.familyHealthTags.map(tag => ({
        ...tag,
        selected: false
      }))
    });
  },

  // 家庭成员表单提交
  async handleFamilyFormSubmit() {
    const { editingMember, newMember } = this.data;
    
    // 如果有 editingMember，说明是编辑模式，调用更新方法
    if (editingMember) {
      await this.saveFamilyMember();
    } else {
      // 否则是新增模式，调用新增方法
      await this.addFamilyMember();
    }
  },

  // 家庭成员表单输入处理
  onMemberInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`newMember.${field}`]: value
    });
  },

  // 选择/取消选择家庭成员健康标签
  toggleFamilyHealthTag(e) {
    const index = e.currentTarget.dataset.index;
    const { familyHealthTags, newMember } = this.data;
    
    // 更新选中状态
    const key = `familyHealthTags[${index}].selected`;
    const newSelected = !familyHealthTags[index].selected;
    
    this.setData({
      [key]: newSelected
    });
    
    // 更新临时数据
    const tagName = familyHealthTags[index].name;
    let newTags = [...newMember.healthTags];
    
    if (newSelected) {
      if (!newTags.includes(tagName)) {
        newTags.push(tagName);
      }
    } else {
      newTags = newTags.filter(item => item !== tagName);
    }
    
    this.setData({
      'newMember.healthTags': newTags
    });
  },

  // 显示家庭成员列表
  showFamilyList() {
    this.setData({
      showFamilyList: true
    });
    this.getFamilyMembers();
  },

  // 隐藏家庭成员列表
  hideFamilyList() {
    this.setData({
      showFamilyList: false
    });
  },

  // 显示成员选项
showMemberOptions(e) {
  const memberId = e.currentTarget.dataset.id;
  const memberName = e.currentTarget.dataset.name;
  
  this.setData({
    showMemberOptions: true,
    selectedMemberId: memberId,
    selectedMemberName: memberName
  });
},

// 隐藏成员选项
hideMemberOptions() {
  this.setData({
    showMemberOptions: false,
    selectedMemberId: null,
    selectedMemberName: ''
  });
},

// 编辑成员
onEditMember() {
  const memberId = this.data.selectedMemberId;
  const member = this.data.familyMembers.find(m => m.id === memberId);
  
  if (member) {
    // 隐藏选项弹窗
    this.hideMemberOptions();
    
    // 延迟显示编辑表单，避免动画冲突
    setTimeout(() => {
      this.editFamilyMember({
        currentTarget: {
          dataset: { id: memberId }
        }
      });
    }, 300);
  }
},

// 删除成员
onDeleteMember() {
  const memberId = this.data.selectedMemberId;
  const memberName = this.data.selectedMemberName;
  
  // 隐藏选项弹窗
  this.hideMemberOptions();
  
  // 延迟执行删除操作
  setTimeout(() => {
    this.deleteFamilyMember({
      currentTarget: {
        dataset: { 
          id: memberId,
          name: memberName
        }
      }
    });
  }, 300);
},

  // 其他已有方法保持不变...
  updateSelectOptions(profileData) {
    const { selectOptions } = this.data;
    
    const updatedAllergens = selectOptions.allergens.map(item => ({
      ...item,
      selected: profileData.allergens ? profileData.allergens.includes(item.name) : false
    }));
    
    const updatedHealthTags = selectOptions.healthTags.map(item => ({
      ...item,
      selected: profileData.healthTags ? profileData.healthTags.includes(item.name) : false
    }));
    
    this.setData({
      'selectOptions.allergens': updatedAllergens,
      'selectOptions.healthTags': updatedHealthTags
    });
  },

  editProfile() {
    this.setData({
      editingProfile: true,
      tempProfile: {
        allergens: [...this.data.userProfile.allergens],
        dietType: this.data.userProfile.dietType,
        healthTags: [...this.data.userProfile.healthTags]
      }
    });
  },

  toggleAllergen(e) {
    const index = e.currentTarget.dataset.index;
    const { selectOptions, tempProfile } = this.data;
    
    const key = `selectOptions.allergens[${index}].selected`;
    const newSelected = !selectOptions.allergens[index].selected;
    
    this.setData({
      [key]: newSelected
    });
    
    const allergenName = selectOptions.allergens[index].name;
    let newAllergens = [...tempProfile.allergens];
    
    if (newSelected) {
      if (!newAllergens.includes(allergenName)) {
        newAllergens.push(allergenName);
      }
    } else {
      newAllergens = newAllergens.filter(item => item !== allergenName);
    }
    
    this.setData({
      'tempProfile.allergens': newAllergens
    });
  },

  toggleHealthTag(e) {
    const index = e.currentTarget.dataset.index;
    const { selectOptions, tempProfile } = this.data;
    
    const key = `selectOptions.healthTags[${index}].selected`;
    const newSelected = !selectOptions.healthTags[index].selected;
    
    this.setData({
      [key]: newSelected
    });
    
    const tagName = selectOptions.healthTags[index].name;
    let newTags = [...tempProfile.healthTags];
    
    if (newSelected) {
      if (!newTags.includes(tagName)) {
        newTags.push(tagName);
      }
    } else {
      newTags = newTags.filter(item => item !== tagName);
    }
    
    this.setData({
      'tempProfile.healthTags': newTags
    });
  },

  selectDietType(e) {
    const value = e.currentTarget.dataset.value;
    this.setData({
      'tempProfile.dietType': value
    });
  },

  async saveProfile() {
    try {
      wx.showLoading({ title: '保存中...', mask: true });

      const { tempProfile } = this.data;
      const params = {
        allergens: tempProfile.allergens,
        dietType: tempProfile.dietType,
        healthTags: tempProfile.healthTags
      };
      
      const res = await app.request('/user/profile', 'POST', params);
      console.log(res);
      wx.hideLoading();
      
      if (res!== undefined) {
        this.setData({
          userProfile: { ...tempProfile },
          editingProfile: false
        });
        
        wx.setStorageSync('userProfile', tempProfile);
        
        const menuItems = this.data.menuItems;
        menuItems[0].badge = tempProfile.allergens.length > 0 ? 1 : 0;
        this.setData({ menuItems });
        
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 2000
        });
        
        app.globalData.userProfile = tempProfile;
      } else {
        wx.showToast({
          title: res.msg || '保存失败',
          icon: 'none'
        });
      }
      
    } catch (error) {
      wx.hideLoading();
      console.error('保存用户画像失败:', error);
      wx.showToast({
        title: '网络异常，请稍后重试',
        icon: 'none'
      });
    }
  },

  cancelEdit() {
    this.setData({
      editingProfile: false,
      tempProfile: {}
    });
  },

  clearAllSelections() {
    wx.showModal({
      title: '确认清空',
      content: '确定要清空所有选择吗？',
      success: (res) => {
        if (res.confirm) {
          const { selectOptions } = this.data;
          
          const resetAllergens = selectOptions.allergens.map(item => ({
            ...item,
            selected: false
          }));
          
          const resetHealthTags = selectOptions.healthTags.map(item => ({
            ...item,
            selected: false
          }));
          
          this.setData({
            'tempProfile.allergens': [],
            'tempProfile.dietType': '',
            'tempProfile.healthTags': [],
            'selectOptions.allergens': resetAllergens,
            'selectOptions.healthTags': resetHealthTags
          });
        }
      }
    });
  },

  // 用户登录
  async handleLogin() {
    wx.navigateTo({
      url: '/pages/login/login', 
      success: (res) => {
        console.log('跳转到登录页成功');
      },
      fail: (err) => {
        console.error('跳转失败，请检查路径是否正确', err);
        wx.showToast({
          title: '跳转失败',
          icon: 'none'
        });
      }
    });
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('userProfile');
          wx.removeStorageSync('familyMembers');
          app.globalData.token = null;
          app.globalData.userProfile = null;
          app.globalData.currentFamilyMember = null;
          
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            userProfile: {
              allergens: [],
              dietType: '',
              healthTags: []
            },
            familyMembers: [],
            currentMemberId: null,
            stats: {
              totalScan: 0,
              riskCount: 0,
              safeCount: 0,
              favoriteCount: 0
            }
          });
          
          // 重置所有选项
          this.resetAllOptions();
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  resetAllOptions() {
    const { selectOptions, familyHealthTags } = this.data;
    
    const resetAllergens = selectOptions.allergens.map(item => ({
      ...item,
      selected: false
    }));
    
    const resetHealthTags = selectOptions.healthTags.map(item => ({
      ...item,
      selected: false
    }));
    
    const resetFamilyTags = familyHealthTags.map(item => ({
      ...item,
      selected: false
    }));
    
    this.setData({
      'selectOptions.allergens': resetAllergens,
      'selectOptions.healthTags': resetHealthTags,
      'familyHealthTags': resetFamilyTags
    });
  },

  // 跳转菜单项
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    const event = e.currentTarget.dataset.event;
    
    if (event === 'editProfile') {
      if (this.data.isLoggedIn) {
        this.editProfile();
      } else {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
      }
    } else if (event === 'showFamilyList') {
      if (this.data.isLoggedIn) {
        this.showFamilyList();
      } else {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
      }
    } else if (url) {
      wx.navigateTo({
        url: url
      });
    }
  },

  viewHistory() {
    wx.navigateTo({
      url: '/pages/history/history'
    });
  },

  viewFavorites() {
    wx.navigateTo({
      url: '/pages/favorite/favorite'
    });
  },

  onShareAppMessage() {
    return {
      title: '食安卫士 - 守护您的食品安全',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-app.jpg'
    };
  },
  // 获取当前成员名称（用于WXML中）
  getCurrentMemberName(currentMemberId, familyMembers) {
    if (!currentMemberId || !familyMembers || familyMembers.length === 0) {
      return '默认';
    }
    
    const member = familyMembers.find(function(m) {
      return m.id === currentMemberId;
    });
    
    return member ? member.name : '默认';
  },

  onPullDownRefresh() {
    if (this.data.isLoggedIn) {
      this.getUserProfile();
      this.getFamilyMembers();
      this.loadUserStats();
    }
    setTimeout(() => {
      wx.stopPullDownRefresh();
    }, 1000);
  }
});