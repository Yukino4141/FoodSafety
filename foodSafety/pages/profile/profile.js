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
        { name: '正常', value: 'normal' },
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
      {
        id: 1,
        text: '健康档案',
        desc: '设置饮食偏好和过敏信息',
        icon: '📋',
        color: 'green',
        event: 'editProfile',
        badge: 0
      },
      {
        id: 2,
        text: '家庭成员',
        desc: '管理家人健康信息',
        icon: '👨‍👩‍👧‍👦',
        color: 'blue',
        event: 'showFamilyList',
        badge: 0
      },
      {
        id: 3,
        text: '检测历史',
        desc: '查看所有检测记录',
        icon: '📚',
        color: 'orange',
        url: '/pages/history/history',
        badge: 3
      },
      {
        id: 4,
        text: '我的收藏',
        desc: '收藏的安全商品',
        icon: '⭐',
        color: 'purple',
        url: '/pages/favorites/favorites'
      },
      {
        id: 5,
        text: '购物清单',
        desc: '待购买商品清单',
        icon: '🛒',
        color: 'teal',
        url: '/pages/shopping/shopping',
        badge: 5
      },
      {
        id: 6,
        text: '意见反馈',
        desc: '帮助我们改进',
        icon: '💬',
        color: 'red',
        url: '/pages/feedback/feedback'
      }
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

  // 加载用户统计
  async loadUserStats() {
    try {
      const history = await app.getScanHistory();
      
      const riskCount = history.filter(item => 
        item.safetyStatus === 'RISK'
      ).length;
      
      this.setData({
        stats: {
          totalScan: history.length,
          riskCount: riskCount,
          safeCount: history.length - riskCount,
          favoriteCount: (wx.getStorageSync('favorites') || []).length
        }
      });
      
    } catch (error) {
      console.error('加载统计数据失败:', error);
      
      // 使用本地数据
      const localHistory = wx.getStorageSync('localScanHistory') || [];
      const favorites = wx.getStorageSync('favorites') || [];
      const localRiskCount = localHistory.filter(item => 
        item.safetyStatus === 'RISK'
      ).length;
      
      this.setData({
        stats: {
          totalScan: localHistory.length,
          riskCount: localRiskCount,
          safeCount: localHistory.length - localRiskCount,
          favoriteCount: favorites.length
        }
      });
    }
  },

  // 获取用户画像
  async getUserProfile() {
    try {
      wx.showLoading({ title: '加载中...', mask: true });
      
      const res = await app.request('/user/profile', 'GET');
      wx.hideLoading();

      if (res.code === 1 && res.data) {
        this.setData({
          userProfile: {
            allergens: res.data.allergens || [],
            dietType: res.data.dietType || '',
            healthTags: res.data.healthTags || []
          }
        });
        this.updateSelectOptions(res.data);
        
        // 更新菜单提示
        if (res.data.allergens && res.data.allergens.length > 0) {
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
      const res = await app.request('/user/family', 'GET');
      
      if (res.code === 1 && res.data) {
        this.setData({
          familyMembers: res.data,
          // 设置默认当前成员（第一个或用户自己）
          currentMemberId: res.data[0]?.id || null
        });
        
        // 更新菜单提示
        const menuItems = this.data.menuItems;
        menuItems[1].badge = res.data.length > 0 ? res.data.length : 0;
        this.setData({ menuItems });
        
        // 保存到本地缓存
        wx.setStorageSync('familyMembers', res.data);
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
            
            if (deleteRes.code === 1) {
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
  },

  // 隐藏家庭成员列表
  hideFamilyList() {
    this.setData({
      showFamilyList: false
    });
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
    wx.switchTab({
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