// pages/favorites/favorites.js
const app = getApp();

Page({
  data: {
    // 收藏列表
    favorites: [],
    loading: true,
    empty: true,
    
    // 分页相关
    pageIndex: 1,
    pageSize: 10,
    total: 0,
    hasMore: true,
    loadingMore: false,
    
    // 编辑模式
    editing: false,
    selectedItems: [],
    selectAll: false,
    
    // 错误处理
    error: false,
    errorMsg: ''
  },

  onShow() {
    console.log('收藏页面显示');
    this.loadFavorites();
  },

  onPullDownRefresh() {
    console.log('下拉刷新收藏列表');
    this.loadFavorites(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMoreFavorites();
    }
  },

  // 加载收藏列表
  async loadFavorites(forceRefresh = false) {
    if (forceRefresh) {
      this.setData({ 
        pageIndex: 1,
        hasMore: true 
      });
    }
    
    this.setData({ 
      loading: true,
      error: false,
      errorMsg: ''
    });
    
    try {
      // 调用后端接口获取收藏列表
      const res = await app.request('/user/product/favorite/list', 'GET', {
        page: this.data.pageIndex,
        pageSize: this.data.pageSize
      });
      
      console.log('收藏列表接口返回:', res);
      
      if (res !== undefined) {
        const favoritesList = res.records || [];
        const total = res.total || 0;
        
        let favoritesData = [];
        if (forceRefresh) {
          favoritesData = favoritesList;
        } else {
          favoritesData = [...this.data.favorites, ...favoritesList];
        }
        
        // 处理图片显示
        const processedFavorites = favoritesData.map(item => ({
          ...item,
          // 确保图片有默认值
          image: item.image || '/assets/images/default-food.png',
          // 确保安全状态有默认值
          safetyStatus: item.safetyStatus || 'SAFE',
          // 确保风险等级有默认值
          riskLevel: item.riskLevel || 0
        }));
        
        this.setData({
          favorites: processedFavorites,
          total: total,
          loading: false,
          empty: favoritesData.length === 0,
          hasMore: processedFavorites.length < total
        });
        
        // 保存到本地缓存
        wx.setStorageSync('favoritesList', processedFavorites);
        
      } else {
        this.setData({
          loading: false,
          empty: true,
          favorites: []
        });
      }
      
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      this.setData({
        loading: false,
        error: true,
        errorMsg: '加载失败，请重试'
      });
      
      // 如果网络请求失败，尝试从本地缓存加载
      const localFavorites = wx.getStorageSync('favoritesList') || [];
      if (localFavorites.length > 0) {
        this.setData({
          favorites: localFavorites,
          empty: false,
          error: false
        });
      }
    }
  },

  // 加载更多收藏
  async loadMoreFavorites() {
    if (!this.data.hasMore || this.data.loadingMore) return;
    
    this.setData({ loadingMore: true });
    
    try {
      const nextPage = this.data.pageIndex + 1;
      
      const res = await app.request('/user/product/favorite/list', 'GET', {
        page: nextPage,
        pageSize: this.data.pageSize
      });
      
      if (res.code === 1 && res.data) {
        const newFavorites = res.data.records || [];
        
        if (newFavorites.length > 0) {
          // 处理图片显示
          const processedNewFavorites = newFavorites.map(item => ({
            ...item,
            image: item.image || '/assets/images/default-food.png',
            safetyStatus: item.safetyStatus || 'SAFE',
            riskLevel: item.riskLevel || 0
          }));
          
          this.setData({
            favorites: [...this.data.favorites, ...processedNewFavorites],
            pageIndex: nextPage,
            hasMore: (this.data.favorites.length + newFavorites.length) < res.data.total
          });
          
          // 更新本地缓存
          const updatedFavorites = [...this.data.favorites, ...processedNewFavorites];
          wx.setStorageSync('favoritesList', updatedFavorites);
        }
      }
      
    } catch (error) {
      console.error('加载更多收藏失败:', error);
    } finally {
      this.setData({ loadingMore: false });
    }
  },

  // 查看商品详情
  viewProductDetail(e) {
    const product = e.currentTarget.dataset.product;
    if (!product) return;
    
    // 优先使用条形码，其次使用ID
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

  // 取消收藏单个商品
  async removeFavorite(e) {
    const product = e.currentTarget.dataset.product;
    if (!product || !product.id) return;
    
    wx.showModal({
      title: '确认取消收藏',
      content: `确定要取消收藏"${product.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用取消收藏接口
            const result = await app.toggleProductFavorite(product.id);
            
            if (result.code === 1) {
              // 从列表中移除
              const updatedFavorites = this.data.favorites.filter(
                item => item.id !== product.id
              );
              
              // 更新本地存储
              wx.setStorageSync('favoritesList', updatedFavorites);
              
              this.setData({
                favorites: updatedFavorites,
                empty: updatedFavorites.length === 0,
                // 如果正在编辑模式，更新选中项
                selectedItems: this.data.selectedItems.filter(id => id !== product.id)
              });
              
              wx.showToast({
                title: '已取消收藏',
                icon: 'success'
              });
            } else {
              wx.showToast({
                title: result.msg || '操作失败',
                icon: 'none'
              });
            }
            
          } catch (error) {
            console.error('取消收藏失败:', error);
            wx.showToast({
              title: error.message || '操作失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 批量删除收藏
  async batchRemoveFavorites() {
    if (this.data.selectedItems.length === 0) {
      wx.showToast({
        title: '请选择要删除的收藏',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '确认批量删除',
      content: `确定要删除选中的${this.data.selectedItems.length}个收藏吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          try {
            // 批量取消收藏
            const promises = this.data.selectedItems.map(productId =>
              app.toggleProductFavorite(productId)
            );
            
            // 等待所有取消操作完成
            const results = await Promise.all(promises);
            
            // 检查是否所有操作都成功
            const allSuccess = results.every(result => result.code === 1);
            
            if (allSuccess) {
              // 更新本地收藏列表
              const remainingFavorites = this.data.favorites.filter(
                item => !this.data.selectedItems.includes(item.id)
              );
              
              // 更新本地存储
              wx.setStorageSync('favoritesList', remainingFavorites);
              
              // 更新页面数据
              this.setData({
                favorites: remainingFavorites,
                selectedItems: [],
                editing: false,
                selectAll: false,
                empty: remainingFavorites.length === 0
              });
              
              wx.hideLoading();
              wx.showToast({
                title: '批量删除成功',
                icon: 'success'
              });
            } else {
              wx.hideLoading();
              wx.showToast({
                title: '部分操作失败，请重试',
                icon: 'none'
              });
            }
            
          } catch (error) {
            wx.hideLoading();
            console.error('批量删除失败:', error);
            wx.showToast({
              title: '批量删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 切换编辑模式
  toggleEditMode() {
    const editing = !this.data.editing;
    this.setData({
      editing: editing,
      selectedItems: editing ? [] : this.data.selectedItems,
      selectAll: false
    });
  },

  // 选择/取消选择单个商品
  toggleSelectItem(e) {
    const productId = e.currentTarget.dataset.id;
    let selectedItems = [...this.data.selectedItems];
    
    const index = selectedItems.indexOf(productId);
    if (index > -1) {
      selectedItems.splice(index, 1);
    } else {
      selectedItems.push(productId);
    }
    
    this.setData({
      selectedItems: selectedItems,
      selectAll: selectedItems.length === this.data.favorites.length
    });
  },

  // 全选/取消全选
  toggleSelectAll() {
    if (this.data.selectAll) {
      this.setData({
        selectedItems: [],
        selectAll: false
      });
    } else {
      const allIds = this.data.favorites.map(item => item.id);
      this.setData({
        selectedItems: allIds,
        selectAll: true
      });
    }
  },

  // 获取安全状态标签
  getSafetyTag(safetyStatus, riskLevel) {
    if (safetyStatus === 'RISK' || riskLevel > 0) {
      return '有风险';
    } else if (safetyStatus === 'SAFE') {
      return '安全';
    } else if (safetyStatus === 'DANGER') {
      return '危险';
    }
    return '未知';
  },

  // 获取安全状态颜色
  getSafetyColor(safetyStatus, riskLevel) {
    if (safetyStatus === 'RISK' || riskLevel > 0) {
      return 'orange';
    } else if (safetyStatus === 'SAFE') {
      return 'green';
    } else if (safetyStatus === 'DANGER') {
      return 'red';
    }
    return 'gray';
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 分享收藏列表
  onShareAppMessage() {
    return {
      title: '我的食安收藏 - 守护健康饮食',
      path: '/pages/favorites/favorites',
      imageUrl: '/assets/images/share-favorites.jpg'
    };
  },

  // 重新加载
  reload() {
    this.loadFavorites(true);
  }
});