// pages/detail/detail.js
const app = getApp();

Page({
  data: {
    product: {
      id: null,
      barcode: '',
      name: '',
      image: '',
      safetyStatus: 'SAFE',
      riskLevel: 0,
      riskMsg: '',
      ingredientList: [],
      updateTime: ''
    },
    
    loading: true,
    isFavorite: false,
    showIngredientModal: false,
    statusBarHeight: 20,
    currentIngredient: null,
    
    // 统计数据
    riskCount: 0,
    additiveCount: 0,
    allergenCount: 0,
  },

  onLoad(options) {
    console.log('详情页参数:', options);
    
    // 获取状态栏高度
    const systemInfo = wx.getSystemInfoSync();
    this.setData({
      statusBarHeight: systemInfo.statusBarHeight
    });
    
    // 获取参数
    const barcode = options.barcode;
    const productId = options.id;
    
    if (barcode) {
      // 通过条形码查询
      this.fetchProductByBarcode(barcode);
    } else if (productId) {
      // 通过ID查询（从历史记录跳转）
      this.fetchProductById(productId);
    } else {
      // 无参数，显示错误
      wx.showToast({
        title: '参数错误',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
    
    // 检查收藏状态
    this.checkFavoriteStatus();
  },

  // 通过条形码查询商品
  async fetchProductByBarcode(barcode) {
    this.setData({ loading: true });
    
    try {
      const productData = await app.scanProduct(barcode);
      console.log('获取到商品数据:', productData);
      
      this.processProductData(productData);
      
      // 保存到本地历史记录
      this.saveToLocalHistory(productData);
      
    } catch (error) {
      console.error('获取商品详情失败:', error);
      
      wx.showToast({
        title: error || '获取商品信息失败',
        icon: 'none',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            if (getCurrentPages().length > 1) {
              wx.navigateBack();
            } else {
              wx.switchTab({
                url: '/pages/index/index'
              });
            }
          }, 2000);
        }
      });
      
      // 显示错误信息
      this.setData({
        product: {
          ...this.data.product,
          name: '获取商品信息失败',
          riskMsg: error || '请检查网络连接'
        },
        loading: false
      });
    }
  },

  // 处理商品数据
  processProductData(productData) {
    console.log('处理商品数据:', productData);
    
    // 解析配料表
    let ingredientList = [];
    if (productData.ingredientList) {
      // 如果是字符串，尝试解析
      if (typeof productData.ingredientList === 'string') {
        ingredientList = app.parseIngredients(productData.ingredientList);
      } else if (Array.isArray(productData.ingredientList)) {
        ingredientList = productData.ingredientList;
      }
    }
    
    // 分析配料风险
    const processedIngredients = ingredientList.map(ingredient => {
      const riskCheck = app.checkIngredientRisk(ingredient);
      return {
        name: ingredient,
        risk: riskCheck.hasRisk,
        riskKeywords: riskCheck.risks
      };
    });
    
    // 统计风险成分
    const riskCount = processedIngredients.filter(item => item.risk).length;
    
    // 更新数据
    this.setData({
      product: {
        id: productData.id,
        barcode: productData.barcode,
        name: productData.name,
        image: productData.image,
        safetyStatus: productData.safetyStatus || 'SAFE',
        riskLevel: productData.riskLevel || 0,
        riskMsg: productData.riskMsg,
        ingredientList: processedIngredients,
        updateTime: productData.updateTime ? 
          this.formatDate(productData.updateTime) : '未知'
      },
      riskCount: riskCount,
      loading: false
    });
    
    console.log('处理后数据:', this.data.product);
  },

  // 保存到本地历史记录
  saveToLocalHistory(productData) {
    try {
      let history = wx.getStorageSync('localScanHistory') || [];
      
      // 避免重复
      history = history.filter(item => item.id !== productData.id);
      
      history.unshift({
        id: productData.id,
        barcode: productData.barcode,
        name: productData.name,
        image: productData.image,
        safetyStatus: productData.safetyStatus,
        riskMsg: productData.riskMsg,
        scanTime: new Date().toISOString()
      });
      
      // 限制最多保存100条
      if (history.length > 100) {
        history = history.slice(0, 100);
      }
      
      wx.setStorageSync('localScanHistory', history);
    } catch (error) {
      console.error('保存本地历史失败:', error);
    }
  },

  // 通过ID查询商品（从历史记录跳转）
  async fetchProductById(productId) {
    this.setData({ loading: true });
    
    // 这里需要后端提供通过ID查询的接口
    // 暂时从本地历史记录中查找
    const history = wx.getStorageSync('localScanHistory') || [];
    const foundProduct = history.find(item => item.id == productId);
    
    if (foundProduct) {
      this.processProductData(foundProduct);
    } else {
      wx.showToast({
        title: '商品信息已过期',
        icon: 'none',
        success: () => {
          setTimeout(() => {
            wx.navigateBack();
          }, 1500);
        }
      });
    }
  },

  // 格式化日期
  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return app.formatTime(date, 'YYYY-MM-DD HH:mm');
    } catch (error) {
      return dateString;
    }
  },

  // 检查收藏状态
  checkFavoriteStatus() {
    const favorites = wx.getStorageSync('favorites') || [];
    const isFavorite = favorites.some(f => f.id === this.data.product.id);
    this.setData({ isFavorite });
  },

  // 返回上一页
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.switchTab({
        url: '/pages/index/index'
      });
    }
  },

  // 下拉刷新
  async onPullDownRefresh() {
    if (this.data.product.barcode) {
      await this.fetchProductByBarcode(this.data.product.barcode);
    }
    wx.stopPullDownRefresh();
  },

  // 分享功能
  onShareAppMessage() {
    const product = this.data.product;
    return {
      title: `${product.name} - 食品安全检测结果`,
      path: `/pages/detail/detail?barcode=${product.barcode}`,
      imageUrl: product.image || '/assets/images/share-default.jpg'
    };
  },

  onShareTimeline() {
    const product = this.data.product;
    return {
      title: `${product.name} - 食品安全检测`,
      query: `barcode=${product.barcode}`,
      imageUrl: product.image || '/assets/images/share-default.jpg'
    };
  },

  // 收藏/取消收藏
  toggleFavorite() {
    const isFavorite = !this.data.isFavorite;
    this.setData({ isFavorite });
    
    let favorites = wx.getStorageSync('favorites') || [];
    
    if (isFavorite) {
      // 添加到收藏
      favorites.unshift({
        id: this.data.product.id,
        barcode: this.data.product.barcode,
        name: this.data.product.name,
        image: this.data.product.image,
        safetyStatus: this.data.product.safetyStatus,
        addTime: new Date().toISOString()
      });
      
      wx.showToast({
        title: '已收藏',
        icon: 'success'
      });
    } else {
      // 移除收藏
      favorites = favorites.filter(f => f.id !== this.data.product.id);
      
      wx.showToast({
        title: '已取消收藏',
        icon: 'success'
      });
    }
    
    wx.setStorageSync('favorites', favorites);
  },

  // 查看配料详情
  showIngredientDetail(e) {
    const index = e.currentTarget.dataset.index;
    const ingredient = this.data.product.ingredientList[index];
    
    this.setData({
      currentIngredient: {
        ...ingredient,
        riskInfo: ingredient.risk ? 
          `含有${ingredient.riskKeywords.join('、')}，建议谨慎食用` : 
          '正常食品成分'
      },
      showIngredientModal: true
    });
  },

  closeIngredientModal() {
    this.setData({
      showIngredientModal: false,
      currentIngredient: null
    });
  },

  // 添加到购物清单
  addToShoppingList() {
    let shoppingList = wx.getStorageSync('shoppingList') || [];
    
    // 检查是否已存在
    const exists = shoppingList.some(item => item.id === this.data.product.id);
    if (exists) {
      wx.showToast({
        title: '已在清单中',
        icon: 'none'
      });
      return;
    }
    
    shoppingList.unshift({
      id: this.data.product.id,
      name: this.data.product.name,
      image: this.data.product.image,
      safetyStatus: this.data.product.safetyStatus,
      quantity: 1,
      addedTime: new Date().toISOString()
    });
    
    wx.setStorageSync('shoppingList', shoppingList);
    
    wx.showToast({
      title: '已加入购物清单',
      icon: 'success'
    });
  },

  // 查找替代品
  checkSimilar() {
    wx.navigateTo({
      url: `/pages/search/search?keyword=${this.data.product.name}&safetyStatus=SAFE`
    });
  },

  // 反馈信息
  submitFeedback(e) {
    const type = e.currentTarget.dataset.type;
    
    wx.showToast({
      title: type === 'accurate' ? '感谢反馈！' : '已收到您的反馈',
      icon: 'success'
    });
    
    // 可以发送到服务器记录
    console.log(`用户反馈：商品 ${this.data.product.id} 信息${type === 'accurate' ? '准确' : '不准确'}`);
  }
});