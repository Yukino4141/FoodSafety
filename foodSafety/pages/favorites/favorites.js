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
    hasMore: true,
    loadingMore: false,
    
    // 编辑模式
    editing: false,
    selectedItems: [],
    selectAll: false
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

  // 加载收藏列表
  async loadFavorites(forceRefresh = false) {
    if (forceRefresh) {
      this.setData({ pageIndex: 1 });
    }
    
    this.setData({ loading: true });
    
    try {
      // 从本地缓存获取收藏列表
      const favoritesList = wx.getStorageSync('favoritesList') || [];
      
      // 如果没有数据，尝试从商品ID列表获取详细信息
      if (favoritesList.length === 0) {
        const favoriteIds = wx.getStorageSync('favorites') || [];
        if (favoriteIds.length > 0) {
          // 这里可以调用接口批量获取商品信息
          // 暂时显示基本信息
          const basicFavorites = favoriteIds.map(id => ({
            id: id,
            name: `商品${id}`,
            image: '/assets/images/default-food.png',
            isFavorite: true
          }));
          
          this.setData({
            favorites: basicFavorites,
            loading: false,
            empty: basicFavorites.length === 0
          });
          return;
        }
      }
      
      this.setData({
        favorites: favoritesList,
        loading: false,
        empty: favoritesList.length === 0
      });
      
    } catch (error) {
      console.error('加载收藏列表失败:', error);
      this.setData({
        loading: false,
        error: true,
        errorMsg: '加载失败，请重试'
      });
    }
  },

  // 查看商品详情
  viewProductDetail(e) {
    const product = e.currentTarget.dataset.product;
    if (product && product.barcode) {
      wx.navigateTo({
        url: `/pages/detail/detail?barcode=${product.barcode}`
      });
    } else if (product && product.id) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${product.id}`
      });
    }
  },

  // 取消收藏
  async removeFavorite(e) {
    const product = e.currentTarget.dataset.product;
    if (!product) return;
    
    wx.showModal({
      title: '确认取消收藏',
      content: `确定要取消收藏"${product.name}"吗？`,
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用取消收藏接口
            await app.toggleProductFavorite(product.id);
            
            // 更新本地收藏状态
            app.updateLocalFavorite(product.id, false);
            
            // 从列表中移除
            const updatedFavorites = this.data.favorites.filter(
              item => item.id !== product.id
            );
            
            // 更新本地存储
            wx.setStorageSync('favoritesList', updatedFavorites);
            
            this.setData({
              favorites: updatedFavorites,
              empty: updatedFavorites.length === 0
            });
            
            wx.showToast({
              title: '已取消收藏',
              icon: 'success'
            });
            
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
            
            await Promise.all(promises);
            
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
    this.setData({
      editing: !this.data.editing,
      selectedItems: []
    });
  },

  // 选择/取消选择单个商品
  toggleSelectItem(e) {
    const productId = e.currentTarget.dataset.id;
    const selectedItems = [...this.data.selectedItems];
    
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

  // 分享收藏列表
  onShareAppMessage() {
    return {
      title: '我的食安收藏 - 守护健康饮食',
      path: '/pages/favorites/favorites',
      imageUrl: '/assets/images/share-favorites.jpg'
    };
  }
});