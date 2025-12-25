// pages/history/history.js
const app = getApp();

Page({
  data: {
    // 历史记录列表
    historyList: [],
    
    // 页面状态
    loading: true,
    loadingMore: false,
    noData: false,
    hasMore: true,
    
    // 分页
    pageIndex: 1,
    pageSize: 10,
    total: 0,
    
    // 筛选条件
    filterStatus: 'all', // all, safe, risk, danger
    filterStatuses: [
      { value: 'all', text: '全部', color: '#666' },
      { value: 'SAFE', text: '安全', color: '#2ecc71' },
      { value: 'RISK', text: '有风险', color: '#e74c3c' },
      { value: 'DANGER', text: '高风险', color: '#c0392b' }
    ],
    
    // 统计信息
    stats: {
      total: 0,
      safe: 0,
      risk: 0,
      danger: 0
    },
    
    // 系统信息
    statusBarHeight: 20,
    capsuleInfo: null,
    
    // 删除相关
    deleting: false,
    selectedItem: null
  },

  onLoad() {
    console.log('历史记录页加载');
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 检查登录状态
    this.checkAuthStatus();
    
    // 加载历史记录
    this.loadHistoryData();
  },

  onShow() {
    console.log('历史记录页显示');
    
    // 每次显示时检查登录状态并刷新数据
    this.checkAuthStatus();
    
    // 如果已经加载过数据，刷新一下
    if (this.data.historyList.length > 0) {
      this.refreshData();
    }
  },

  onPullDownRefresh() {
    console.log('下拉刷新历史记录');
    this.refreshData();
  },

  onReachBottom() {
    console.log('上拉加载更多');
    if (this.data.hasMore && !this.data.loading && !this.data.loadingMore) {
      this.loadMoreData();
    }
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

  // 检查认证状态
  checkAuthStatus() {
    const token = wx.getStorageSync('token');
    if (!token) {
      // 未登录，跳转到登录页
      wx.showModal({
        title: '登录提示',
        content: '需要登录才能查看历史记录',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      });
      return false;
    }
    return true;
  },

  // ==================== 数据加载 ====================

  // 加载历史记录数据
  async loadHistoryData() {
    if (!this.checkAuthStatus()) return;
    
    this.setData({
      loading: true,
      noData: false
    });
    
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    try {
      // 调用历史记录接口
      const history = await app.getScanHistory();
      console.log('获取到历史记录:', history.length, '条');
      
      // 计算统计信息
      const stats = this.calculateStats(history);
      
      // 应用筛选
      const filteredList = this.applyFilter(history, this.data.filterStatus);
      
      this.setData({
        historyList: filteredList,
        loading: false,
        noData: filteredList.length === 0,
        stats: stats,
        hasMore: false // 接口返回所有数据，不需要分页
      });
      
    } catch (error) {
      console.error('加载历史记录失败:', error);
      
      this.setData({
        loading: false,
        noData: true
      });
      
      this.handleLoadError(error);
      
    } finally {
      wx.hideLoading();
    }
  },

  // 刷新数据
  async refreshData() {
    this.setData({
      pageIndex: 1,
      loadingMore: false
    });
    
    await this.loadHistoryData();
    wx.stopPullDownRefresh();
  },

  // 加载更多数据
  async loadMoreData() {
    if (!this.data.hasMore) return;
    
    this.setData({
      loadingMore: true,
      pageIndex: this.data.pageIndex + 1
    });
    
    try {
      // 由于历史记录接口一次性返回所有数据，这里不需要加载更多
      // 如果有分页需求，可以在这里实现
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setData({
        loadingMore: false,
        hasMore: false
      });
      
    } catch (error) {
      console.error('加载更多失败:', error);
      this.setData({
        loadingMore: false
      });
    }
  },

  // 计算统计信息
  calculateStats(history) {
    const stats = {
      total: history.length,
      safe: 0,
      risk: 0,
      danger: 0
    };
    
    history.forEach(item => {
      switch (item.safetyStatus) {
        case 'SAFE':
          stats.safe++;
          break;
        case 'RISK':
          stats.risk++;
          break;
        case 'DANGER':
          stats.danger++;
          break;
      }
    });
    
    return stats;
  },

  // 应用筛选
  applyFilter(history, filterStatus) {
    if (filterStatus === 'all') {
      return history;
    }
    return history.filter(item => item.safetyStatus === filterStatus);
  },

  // 处理加载错误
  handleLoadError(error) {
    const errorMsg = error.message || error;
    
    if (errorMsg.includes('请先登录') || errorMsg.includes('登录已过期')) {
      // 登录相关错误
      wx.showModal({
        title: '登录提示',
        content: '登录已过期，请重新登录',
        showCancel: false,
        success: () => {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      });
      
    } else if (errorMsg.includes('网络') || errorMsg.includes('超时')) {
      // 网络错误
      wx.showToast({
        title: '网络连接失败',
        icon: 'none',
        duration: 2000
      });
      
    } else {
      // 其他错误
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // ==================== 筛选功能 ====================

  // 切换筛选状态
  onFilterChange(e) {
    const filterStatus = e.currentTarget.dataset.status;
    
    if (this.data.filterStatus === filterStatus) return;
    
    this.setData({
      filterStatus: filterStatus,
      loading: true
    }, async () => {
      // 重新获取数据并应用筛选
      try {
        const history = await app.getScanHistory();
        const filteredList = this.applyFilter(history, filterStatus);
        
        this.setData({
          historyList: filteredList,
          loading: false,
          noData: filteredList.length === 0
        });
      } catch (error) {
        console.error('筛选失败:', error);
        this.setData({
          loading: false
        });
      }
    });
  },

  // ==================== 操作功能 ====================

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

  // 长按显示操作菜单
  onItemLongPress(e) {
    const product = e.currentTarget.dataset;
    
    wx.showActionSheet({
      itemList: ['查看详情', '复制条形码', '删除记录'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0: // 查看详情
            this.viewDetail({ currentTarget: { dataset: product } });
            break;
            
          case 1: // 复制条形码
            this.copyBarcode(product.barcode);
            break;
            
          case 2: // 删除记录
            this.confirmDelete(product);
            break;
        }
      }
    });
  },

  // 复制条形码
  copyBarcode(barcode) {
    if (!barcode) return;
    
    wx.setClipboardData({
      data: barcode,
      success: () => {
        wx.showToast({
          title: '条形码已复制',
          icon: 'success'
        });
      }
    });
  },

  // 确认删除
  confirmDelete(product) {
    this.setData({
      selectedItem: product
    });
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${product.name}"的记录吗？`,
      confirmText: '删除',
      confirmColor: '#e74c3c',
      success: (res) => {
        if (res.confirm) {
          this.deleteHistoryItem(product);
        }
      }
    });
  },

  // 删除历史记录
  async deleteHistoryItem(product) {
    this.setData({
      deleting: true
    });
    
    wx.showLoading({
      title: '删除中...',
      mask: true
    });
    
    try {
      // TODO: 调用后端删除接口
      // await app.deleteScanHistory(product.id);
      
      // 暂时从前端移除
      const newList = this.data.historyList.filter(item => 
        item.barcode !== product.barcode
      );
      
      // 更新统计
      const newStats = { ...this.data.stats };
      newStats.total--;
      switch (product.safetyStatus) {
        case 'SAFE': newStats.safe--; break;
        case 'RISK': newStats.risk--; break;
        case 'DANGER': newStats.danger--; break;
      }
      
      this.setData({
        historyList: newList,
        noData: newList.length === 0,
        stats: newStats,
        deleting: false,
        selectedItem: null
      });
      
      wx.showToast({
        title: '删除成功',
        icon: 'success'
      });
      
    } catch (error) {
      console.error('删除失败:', error);
      
      this.setData({
        deleting: false
      });
      
      wx.showToast({
        title: '删除失败',
        icon: 'none'
      });
      
    } finally {
      wx.hideLoading();
    }
  },

  // ==================== 其他功能 ====================

  // pages/history/history.js

// 清空所有历史记录
async clearAllHistory() {
  wx.showModal({
    title: '确认清空',
    content: '确定要清空所有历史记录吗？此操作不可恢复',
    confirmText: '清空',
    confirmColor: '#e74c3c',
    cancelText: '取消',
    success: async (res) => {
      if (res.confirm) {
        await this.executeClearAllHistory();
      }
    }
  });
},

// 执行清空历史记录
async executeClearAllHistory() {
  wx.showLoading({
    title: '清空中...',
    mask: true
  });
  
  try {
    // 调用后端清空接口
    await app.clearAllHistory();
    
    // 清空本地缓存
    wx.removeStorageSync('localScanHistory');
    
    // 更新页面状态
    this.setData({
      historyList: [],
      noData: true,
      stats: { 
        total: 0, 
        safe: 0, 
        risk: 0, 
        danger: 0 
      }
    });
    
    wx.showToast({
      title: '已清空',
      icon: 'success',
      duration: 2000
    });
    
    console.log('历史记录清空成功');
    
  } catch (error) {
    console.error('清空历史记录失败:', error);
    
    this.handleClearError(error);
    
  } finally {
    wx.hideLoading();
  }
},

// 处理清空错误
handleClearError(error) {
  const errorMsg = error.message || error;
  
  if (errorMsg.includes('请先登录') || errorMsg.includes('登录已过期')) {
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
    
  } else if (errorMsg.includes('网络') || errorMsg.includes('超时')) {
    // 网络错误
    wx.showToast({
      title: '网络连接失败',
      icon: 'none',
      duration: 2000
    });
    
  } else {
    // 其他错误
    wx.showToast({
      title: errorMsg || '清空失败',
      icon: 'none',
      duration: 2000
    });
  }
},

  // 返回首页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  },

  // 去扫码
  goToScan() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  // 格式化时间
  formatTime(date, format = 'MM-DD HH:mm') {
    if (!date) return '';
    
    try {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      const hour = d.getHours();
      const minute = d.getMinutes();

      const pad = n => n.toString().padStart(2, '0');

      return format
        .replace('YYYY', year)
        .replace('MM', pad(month))
        .replace('DD', pad(day))
        .replace('HH', pad(hour))
        .replace('mm', pad(minute));
    } catch (error) {
      return date;
    }
  }
});