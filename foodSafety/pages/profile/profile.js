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
    menuItems: [
      { icon: 'star', text: '我的收藏', url: '/pages/favorite/favorite' },
      { icon: 'setting', text: '偏好设置', url: '/pages/preference/preference' },
      { icon: 'question', text: '使用帮助', url: '/pages/help/help' },
      { icon: 'info', text: '关于我们', url: '/pages/about/about' }
    ]
  },

  onShow() {
    this.checkLogin();
    this.loadUserStats();
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

  // 用户登录
  async handleLogin() {
    try {
    /*
      wx.showLoading({
        title: '登录中...',
        mask: true
      });
      
      const userData = await app.login();
      
      // 获取用户信息
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          wx.setStorageSync('userInfo', res.userInfo);
          this.setData({
            userInfo: res.userInfo,
            isLoggedIn: true
          });
          
          // 重新加载统计
          this.loadUserStats();
          
          wx.showToast({
            title: '登录成功',
            icon: 'success'
          });
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err);
          // 仍然算登录成功
          this.setData({
            isLoggedIn: true
          });
          this.loadUserStats();
        }
      });*/
      
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
    
    } catch (error) {
      console.error('登录失败:', error);
      wx.showToast({
        title: error || '登录失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
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
          app.globalData.token = null;
          
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            stats: {
              totalScan: 0,
              riskCount: 0,
              safeCount: 0,
              favoriteCount: 0
            }
          });
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转菜单项
  navigateTo(e) {
    const url = e.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({
        url: url
      });
    }
  },

  // 查看扫描历史
  viewHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    });
  },

  // 查看收藏
  viewFavorites() {
    wx.navigateTo({
      url: '/pages/favorite/favorite'
    });
  },

  // 分享小程序
  onShareAppMessage() {
    return {
      title: '食安卫士 - 守护您的食品安全',
      path: '/pages/index/index',
      imageUrl: '/assets/images/share-app.jpg'
    };
  }
});