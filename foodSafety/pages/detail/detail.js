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
      updateTime: '',
      safetyText: '安全',
      safetyColor: '#2ecc71',
      riskLevelText: '安全',
      
      // V1.1 新增字段
      nutritionInfo: {},
      shelfLife: '',
      manufacturer: '',
      
      // 新增个性化分析字段
      hasPersonalizedAnalysis: false,
      personalizedRiskMsg: '',
      profileSource: '', // 'user' 或 'family'
      profileName: '',
      matchedAllergens: [],
      
      // 互动字段
      isFavorite: false,
      
      // 日期选择器相关
      fridgeForm: {
        expiryDate: '',
        purchaseDate: ''
      },
      datePickerVisible: false,
      currentDateField: '',
      datePickerTitle: '选择日期',
      datePickerValue: '',
      minDate: '2020-01-01',
      maxDate: '2030-12-31',
      
      // 保质期建议
      shelfLifeSuggestions: [],
    },
    // 冰箱添加相关字段
    showAddToFridgeModal: false,
    fridgeLoading: false,

    loading: true,
    favoriteLoading: false,
    showIngredientModal: false,
    statusBarHeight: 20,
    currentIngredient: null,
    hasError: false,
    error: '',
    refreshing: false,
    
    // 统计数据
    riskCount: 0,
    additiveCount: 0,
    allergenCount: 0,
    
    // 营养成分数据
    nutritionItems: [],
    
    // 个性化分析提示
    showPersonalizedWarning: false,
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
      this.showError('参数错误', true);
    }
  },

  // 通过条形码查询商品（更新版，支持个性化分析）
  async fetchProductByBarcode(barcode) {
    this.setData({ 
      loading: true,
      hasError: false,
      error: ''
    });
    
    wx.showLoading({ title: '加载中...', mask: true });
    
    try {
      console.log('开始查询商品，条形码:', barcode);
      
      // 使用app.js中的scanProductDetail方法（支持个性化分析）
      const productData = await app.scanProductDetail(barcode);
      console.log('获取到商品数据（含个性化分析）:', productData);
      
      if (productData) {
        this.setProductData(productData);
        
        // 检查收藏状态（从接口获取）
        if (productData.id) {
          this.checkFavoriteStatusFromAPI(productData.id);
        }
      } else {
        throw new Error('未找到商品信息');
      }
      
    } catch (error) {
      console.error('获取商品详情失败:', error);
      this.handleLoadError(error);
    } finally {
      wx.hideLoading();
    }
  },

  // 通过ID查询商品
  async fetchProductById(productId) {
    this.setData({ 
      loading: true,
      hasError: false,
      error: ''
    });
    
    wx.showLoading({ title: '加载中...', mask: true });
    
    try {
      console.log('通过ID查询商品:', productId);
      
      // 先尝试从历史记录中查找
      const history = await app.getScanHistory();
      const foundProduct = history.find(item => item.id == productId);
      
      if (foundProduct) {
        // 如果有条形码，重新获取最新数据
        if (foundProduct.barcode) {
          await this.fetchProductByBarcode(foundProduct.barcode);
        } else {
          // 否则使用历史记录中的数据
          this.setProductData(foundProduct);
          
          // 检查收藏状态
          if (foundProduct.id) {
            this.checkFavoriteStatusFromAPI(foundProduct.id);
          }
        }
      } else {
        throw new Error('商品信息已过期');
      }
      
    } catch (error) {
      console.error('通过ID查询失败:', error);
      this.handleLoadError(error);
    } finally {
      wx.hideLoading();
    }
  },

  // 设置商品数据（更新版，支持V1.1和V2.0特性）
  setProductData(productData) {
    console.log('设置商品数据:', productData);
    
    // 从app.js处理的数据中获取安全信息
    const safetyInfo = app.getSafetyInfo(productData.safetyStatus);
    
    // 分析配料风险
    const processedIngredients = this.processIngredients(productData.ingredientList || []);
    const riskCount = processedIngredients.filter(item => item.risk).length;
    
    // 处理营养成分信息（V1.1）
    const nutritionItems = this.processNutritionInfo(productData.nutritionInfo || {});
    
    // 获取个性化分析信息
    const hasPersonalizedAnalysis = !!productData.profileSource;
    const showPersonalizedWarning = productData.profileSource && productData.safetyStatus === 'RISK';
    
    const product = {
      id: productData.id,
      barcode: productData.barcode,
      name: productData.name || '未知商品',
      image: productData.image || '/assets/images/default-food.png',
      safetyStatus: productData.safetyStatus || 'SAFE',
      riskLevel: productData.riskLevel || 0,
      riskMsg: productData.riskMsg || '',
      ingredientList: processedIngredients,
      updateTime: productData.updateTime,
      displayTime: productData.displayTime || this.formatDate(productData.updateTime),
      safetyText: safetyInfo.text,
      safetyColor: safetyInfo.color,
      riskLevelText: productData.riskLevel === 2 ? '高风险' : 
                   productData.riskLevel === 1 ? '有风险' : '安全',
      
      // V1.1 新增字段
      nutritionInfo: productData.nutritionInfo || {},
      nutritionItems: nutritionItems,
      shelfLife: productData.shelfLife || '',
      manufacturer: productData.manufacturer || '',
      
      // 互动字段（从接口获取）
      isFavorite: productData.isFavorite || false,
      
      // 个性化分析字段
      hasPersonalizedAnalysis: hasPersonalizedAnalysis,
      personalizedRiskMsg: productData.riskMsg || '',
      profileSource: productData.profileSource || '',
      profileName: productData.profileName || '',
      matchedAllergens: productData.matchedAllergens || [],
      showPersonalizedWarning: showPersonalizedWarning
    };
    
    this.setData({
      product: product,
      riskCount: riskCount,
      nutritionItems: nutritionItems,
      loading: false,
      hasError: false,
      showPersonalizedWarning: showPersonalizedWarning
    });
    
    console.log('商品数据设置完成:', this.data.product);
  },

  // 处理配料表
  processIngredients(ingredientList) {
    if (!Array.isArray(ingredientList) || ingredientList.length === 0) {
      return [];
    }
    
    return ingredientList.map(ingredient => {
      let ingredientName = ingredient;
      if (typeof ingredient === 'object' && ingredient.name) {
        ingredientName = ingredient.name;
      }
      
      // 检查风险关键词
      const riskCheck = this.checkIngredientRisk(ingredientName);
      
      return {
        name: ingredientName,
        risk: riskCheck.hasRisk,
        riskKeywords: riskCheck.risks,
        isHighRisk: riskCheck.isHighRisk
      };
    });
  },

  // 处理营养成分信息（V1.1）
  processNutritionInfo(nutritionInfo) {
    if (!nutritionInfo || typeof nutritionInfo !== 'object') {
      return [];
    }
    
    const nutritionItems = [];
    const nutritionOrder = ['能量', '蛋白质', '脂肪', '碳水化合物', '钠', '糖'];
    
    // 按照顺序添加营养成分
    for (const key of nutritionOrder) {
      if (nutritionInfo[key]) {
        nutritionItems.push({
          name: key,
          value: nutritionInfo[key],
          unit: this.getNutritionUnit(key)
        });
      }
    }
    
    // 添加其他营养成分
    for (const [key, value] of Object.entries(nutritionInfo)) {
      if (!nutritionOrder.includes(key) && value) {
        nutritionItems.push({
          name: key,
          value: value,
          unit: this.getNutritionUnit(key)
        });
      }
    }
    
    return nutritionItems;
  },

  // 获取营养成分单位
  getNutritionUnit(key) {
    const unitMap = {
      '能量': 'kJ',
      '蛋白质': 'g',
      '脂肪': 'g',
      '碳水化合物': 'g',
      '钠': 'mg',
      '糖': 'g',
      '胆固醇': 'mg',
      '膳食纤维': 'g',
      '维生素': 'mg',
      '钙': 'mg',
      '铁': 'mg'
    };
    
    return unitMap[key] || '';
  },

  // 检查配料风险
  checkIngredientRisk(ingredient) {
    const riskKeywords = app.globalData.riskKeywords || [];
    const highRiskKeywords = app.globalData.highRiskKeywords || [];
    
    const foundRisks = [];
    let isHighRisk = false;
    
    // 检查高风险关键词
    for (const keyword of highRiskKeywords) {
      if (ingredient.includes(keyword)) {
        foundRisks.push(keyword);
        isHighRisk = true;
        break;
      }
    }
    
    // 检查普通风险关键词
    if (!isHighRisk) {
      for (const keyword of riskKeywords) {
        if (ingredient.includes(keyword)) {
          foundRisks.push(keyword);
        }
      }
    }
    
    return {
      hasRisk: foundRisks.length > 0,
      risks: foundRisks,
      isHighRisk: isHighRisk
    };
  },


  // 检查收藏状态（从API获取）
  async checkFavoriteStatusFromAPI(productId) {
    if (!productId) return;
    
    try {
      // 从接口获取收藏状态
      // 注意：根据接口文档，收藏状态会直接从扫码接口返回
      // 这里我们只需更新UI状态
      const isFavorite = await app.checkProductFavorite(productId);
      this.setData({
        'product.isFavorite': isFavorite
      });
      
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      // 如果接口失败，使用本地缓存
      this.checkFavoriteStatusFromLocal(productId);
    }
  },

  // 检查收藏状态（从本地缓存）
  checkFavoriteStatusFromLocal(productId) {
    try {
      const favorites = wx.getStorageSync('favorites') || [];
      const isFavorite = favorites.some(f => f.id === productId);
      this.setData({
        'product.isFavorite': isFavorite
      });
    } catch (error) {
      console.error('检查本地收藏状态失败:', error);
    }
  },

  // ==================== 收藏功能（对接接口） ====================

  // 收藏/取消收藏商品
  async toggleFavorite() {
    const product = this.data.product;
    if (!product.id) {
      wx.showToast({ title: '商品信息错误', icon: 'none' });
      return;
    }
    
    this.setData({ favoriteLoading: true });
    
    try {
      console.log('调用收藏接口，商品ID:', product.id);
      
      // 调用收藏接口
      const result = await app.toggleProductFavorite(product.id);
      console.log('收藏操作结果:', result);
      
      // 更新本地收藏状态
      app.updateLocalFavorite(product.id, result);
      
      // 更新UI状态
      this.setData({
        'product.isFavorite': result,
        favoriteLoading: false
      });
      
      // 显示操作反馈
      wx.showToast({
        title: result ? '已收藏' : '已取消收藏',
        icon: 'success',
        duration: 1000
      });
      
      // 如果是收藏操作，添加到收藏列表
      if (result) {
        this.addToFavoritesList(product);
      } else {
        // 如果是取消收藏，从收藏列表中移除
        this.removeFromFavoritesList(product.id);
      }
      
    } catch (error) {
      console.error('收藏操作失败:', error);
      this.setData({ favoriteLoading: false });
      
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 添加到收藏列表
  addToFavoritesList(product) {
    try {
      let favoritesList = wx.getStorageSync('favoritesList') || [];
      
      // 避免重复
      const existingIndex = favoritesList.findIndex(item => item.id === product.id);
      if (existingIndex > -1) {
        favoritesList.splice(existingIndex, 1);
      }
      
      // 添加到列表开头
      favoritesList.unshift({
        id: product.id,
        name: product.name,
        image: product.image,
        barcode: product.barcode,
        safetyStatus: product.safetyStatus,
        safetyText: product.safetyText,
        safetyColor: product.safetyColor,
        addTime: new Date().toISOString(),
        productData: product
      });
      
      // 限制数量
      if (favoritesList.length > 100) {
        favoritesList = favoritesList.slice(0, 100);
      }
      
      wx.setStorageSync('favoritesList', favoritesList);
      console.log('收藏列表已更新，当前收藏数:', favoritesList.length);
      
    } catch (error) {
      console.error('添加到收藏列表失败:', error);
    }
  },

  // 从收藏列表移除
  removeFromFavoritesList(productId) {
    try {
      let favoritesList = wx.getStorageSync('favoritesList') || [];
      favoritesList = favoritesList.filter(item => item.id !== productId);
      wx.setStorageSync('favoritesList', favoritesList);
      console.log('从收藏列表移除，剩余:', favoritesList.length);
    } catch (error) {
      console.error('从收藏列表移除失败:', error);
    }
  },

  // ==================== 错误处理 ====================

  // 处理加载错误
  handleLoadError(error) {
    console.error('商品加载错误:', error);
    
    const errorMessage = error.message || error.toString();
    let userMessage = '获取商品信息失败';
    let shouldShowRetry = true;
    
    if (errorMessage.includes('登录') || errorMessage.includes('token')) {
      userMessage = '请先登录';
    } else if (errorMessage.includes('网络') || errorMessage.includes('timeout')) {
      userMessage = '网络连接失败';
    } else if (errorMessage.includes('未找到') || errorMessage.includes('未收录') || errorMessage.includes('40401')) {
      userMessage = '该商品未收录，敬请期待！';
      shouldShowRetry = false;
    } else if (errorMessage.includes('code: 0')) {
      // 业务逻辑错误
      const match = errorMessage.match(/msg: (.+)/);
      userMessage = match ? match[1] : '查询失败';
    }
    
    this.setData({
      loading: false,
      hasError: true,
      error: userMessage,
      product: {
        ...this.data.product,
        name: userMessage,
        riskMsg: errorMessage.length > 100 ? errorMessage.substring(0, 100) + '...' : errorMessage
      }
    });
    
    // 显示错误提示
    const title = shouldShowRetry ? userMessage + '，点击重试' : userMessage;
    wx.showToast({
      title: title,
      icon: 'none',
      duration: 2000
    });
  },

  // 显示错误并返回
  showError(message, shouldBack = false) {
    this.setData({
      loading: false,
      hasError: true,
      error: message
    });
    
    wx.showToast({
      title: message,
      icon: 'none',
      duration: 1500,
      success: () => {
        if (shouldBack) {
          setTimeout(() => {
            this.goBack();
          }, 1500);
        }
      }
    });
  },

  // ==================== 页面交互方法 ====================

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
    this.setData({ refreshing: true });
    
    if (this.data.product.barcode) {
      await this.fetchProductByBarcode(this.data.product.barcode);
    }
    
    setTimeout(() => {
      this.setData({ refreshing: false });
      wx.stopPullDownRefresh();
    }, 500);
  },

  // 分享功能
  onShareAppMessage() {
    const product = this.data.product;
    let title = `${product.name}`;
    let desc = `安全等级：${product.safetyText}`;
    
    // 如果是风险商品，分享时提醒
    if (product.safetyStatus !== 'SAFE') {
      title += ' ⚠️请注意风险';
      desc = `检测结果：${product.safetyText}，${product.riskMsg || '存在食品安全风险'}`;
    }
    
    return {
      title: title,
      desc: desc,
      path: `/pages/detail/detail?barcode=${product.barcode}`,
      imageUrl: product.image || '/assets/images/default-food.png'
    };
  },

  onShareTimeline() {
    const product = this.data.product;
    let title = `${product.name} - 食品安全检测`;
    
    if (product.safetyStatus !== 'SAFE') {
      title = `⚠️${product.name}有${product.safetyStatus === 'RISK' ? '风险' : '高风险'}！`;
    }
    
    return {
      title: title,
      query: `barcode=${product.barcode}`,
      imageUrl: product.image || '/assets/images/default-food.png'
    };
  },

  // 分享商品
  shareProduct() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage', 'shareTimeline']
    });
  },

  // 查看配料详情
  showIngredientDetail(e) {
    const index = e.currentTarget.dataset.index;
    const ingredients = this.data.product.ingredientList;
    
    if (index >= 0 && index < ingredients.length) {
      const ingredient = ingredients[index];
      
      let riskInfo = '正常食品成分';
      if (ingredient.risk) {
        if (ingredient.isHighRisk) {
          riskInfo = `⚠️ 高风险成分：含有${ingredient.riskKeywords.join('、')}，请谨慎食用！`;
        } else {
          riskInfo = `⚠️ 风险成分：含有${ingredient.riskKeywords.join('、')}，建议减少摄入频率`;
        }
      }
      
      this.setData({
        currentIngredient: {
          name: ingredient.name,
          risk: ingredient.risk || false,
          riskKeywords: ingredient.riskKeywords || [],
          riskInfo: riskInfo
        },
        showIngredientModal: true
      });
    }
  },

  // 关闭配料详情弹窗
  closeIngredientModal() {
    this.setData({
      showIngredientModal: false,
      currentIngredient: null
    });
  },

  // 添加到购物清单
  addToShoppingList() {
    try {
      let shoppingList = wx.getStorageSync('shoppingList') || [];
      const product = this.data.product;
      
      // 检查是否已存在
      const exists = shoppingList.some(item => 
        item.id === product.id || 
        item.barcode === product.barcode
      );
      
      if (exists) {
        wx.showToast({
          title: '已在清单中',
          icon: 'none',
          duration: 1000
        });
        return;
      }
      
      shoppingList.unshift({
        id: product.id,
        barcode: product.barcode,
        name: product.name,
        image: product.image,
        safetyStatus: product.safetyStatus,
        safetyText: product.safetyText,
        quantity: 1,
        addedTime: new Date().toISOString()
      });
      
      wx.setStorageSync('shoppingList', shoppingList);
      
      wx.showToast({
        title: '已加入购物清单',
        icon: 'success',
        duration: 1000
      });
      
    } catch (error) {
      console.error('添加到购物清单失败:', error);
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      });
    }
  },

  // 查找更安全的替代品
  findSaferAlternatives() {
    const product = this.data.product;
    const keyword = encodeURIComponent(product.name);
    
    wx.navigateTo({
      url: `/pages/search/search?keyword=${keyword}&safetyStatus=SAFE`
    });
  },

  // 重新加载
  rescanProduct() {
    if (this.data.product.barcode) {
      this.fetchProductByBarcode(this.data.product.barcode);
    } else {
      this.goBack();
    }
  },

  // 用户反馈
  submitFeedback(e) {
    const type = e.currentTarget.dataset.type;
    const product = this.data.product;
    
    const feedbackTypes = {
      accurate: '信息准确',
      inaccurate: '信息不准确',
      outdated: '信息已过期'
    };
    
    const feedbackText = feedbackTypes[type] || '反馈';
    
    wx.showToast({
      title: `感谢您的${feedbackText}！`,
      icon: 'success',
      duration: 1500
    });
    
    // 可以在这里发送反馈到服务器
    console.log(`商品反馈：${product.id} (${product.name}) - ${feedbackText}`);
    
    // 示例：保存到本地
    try {
      let feedbacks = wx.getStorageSync('productFeedbacks') || [];
      feedbacks.unshift({
        productId: product.id,
        productName: product.name,
        barcode: product.barcode,
        feedbackType: type,
        feedbackText: feedbackText,
        time: new Date().toISOString()
      });
      
      wx.setStorageSync('productFeedbacks', feedbacks);
    } catch (error) {
      console.error('保存反馈失败:', error);
    }
  },

  // 复制条形码
  copyBarcode() {
    const barcode = this.data.product.barcode;
    if (!barcode) {
      wx.showToast({
        title: '无条形码信息',
        icon: 'none'
      });
      return;
    }
    
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

  // 保存商品（收藏的别名）
  saveProduct() {
    this.toggleFavorite();
  },

  // 检查类似商品（找替代的别名）
  checkSimilar() {
    this.findSaferAlternatives();
  },

  // 预览图片
  previewImage() {
    const image = this.data.product.image || '/assets/images/default-food.png';
    if (image) {
      wx.previewImage({
        urls: [image]
      });
    }
  },

  // 获取配料标签类
  getRiskTagClass(item) {
    return item.risk ? (item.isHighRisk ? 'high-risk-tag' : 'risk-tag') : 'safe-tag';
  },

  // 获取配料标签文本
  getRiskTagText(item) {
    return item.risk ? (item.isHighRisk ? '高风险' : '风险') : '安全';
  },

  // 检查是否过敏原
  isAllergen(item) {
    const allergens = ['花生', '牛奶', '鸡蛋', '海鲜', '大豆', '坚果', '芒果', '芝麻', '小麦'];
    
    // 获取当前用户的过敏原信息
    const userProfile = app.globalData.userProfile;
    const familyMember = app.globalData.currentFamilyMember;
    
    const userAllergens = userProfile?.allergens || [];
    const familyAllergens = familyMember?.healthTags || [];
    const allAllergens = [...userAllergens, ...familyAllergens];
    
    // 检查是否是用户的过敏原
    for (const allergen of allAllergens) {
      if (item.name.includes(allergen)) {
        return true;
      }
    }
    
    // 检查是否是常见过敏原
    for (const allergen of allergens) {
      if (item.name.includes(allergen)) {
        return true;
      }
    }
    
    return false;
  },

  // 查看过敏原详情
  showAllergenInfo(e) {
    const ingredient = e.currentTarget.dataset.ingredient;
    if (this.isAllergen(ingredient)) {
      wx.showModal({
        title: '过敏原提醒',
        content: `此成分"${ingredient.name}"可能是过敏原。\n如果您对该成分过敏，请避免食用。`,
        showCancel: false,
        confirmText: '知道了'
      });
    }
  },

  // 验证日期格式
  validateDate(dateStr) {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateStr)) return false;
    
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date);
  },

  // 购买日期改变
  onPurchaseDateChange(e) {
    const value = e.detail.value;
    this.setData({
      'fridgeForm.purchaseDate': value
    });
    console.log('购买日期已选择:', value);
  },

  // 过期日期改变
  onExpiryDateChange(e) {
    const value = e.detail.value;
    this.setData({
      'fridgeForm.expiryDate': value
    });
    console.log('过期日期已选择:', value);
  },

// 删除旧的日期选择器相关方法（可选）
// showDatePicker, confirmDatePicker, closeDatePicker, quickSetDate 等方法可以删除

  // 保存到冰箱
  async saveToInventory(product, expiryDate) {
    wx.showLoading({ title: '添加中...' });
    
    try {
      const inventoryData = {
        productId: product.id,
        expiryDate: expiryDate,
        purchaseDate: new Date().toISOString().split('T')[0] // 今天作为购买日期
      };
      
      await app.addToInventory(inventoryData);
      
      wx.showToast({
        title: '已添加到我的冰箱',
        icon: 'success',
        duration: 2000
      });
      
      // 可以跳转到冰箱页面
      // setTimeout(() => {
      //   wx.switchTab({
      //     url: '/pages/inventory/inventory'
      //   });
      // }, 1500);
      
    } catch (error) {
      console.error('添加到冰箱失败:', error);
      wx.showToast({
        title: error.message || '添加失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
    }
  },

  // 页面显示
  onShow() {
    // 重新检查收藏状态
    if (this.data.product.id && !this.data.loading) {
      this.checkFavoriteStatusFromLocal(this.data.product.id);
    }
  },

  // 查看个性化分析详情
  showPersonalizedAnalysis() {
    const product = this.data.product;
    
    if (!product.hasPersonalizedAnalysis) return;
    
    let content = '';
    if (product.matchedAllergens.length > 0) {
      content = `根据${product.profileName}的健康档案，检测到以下过敏原：\n`;
      content += `• ${product.matchedAllergens.join('\n• ')}\n\n`;
      content += `建议避免食用含有这些成分的食品。`;
    } else {
      content = `根据${product.profileName}的健康档案，未发现需要特别关注的成分。`;
    }
    
    wx.showModal({
      title: '个性化分析结果',
      content: content,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示添加到冰箱的日期选择器
  async addToInventory() {
    console.log('=== DEBUG: addToInventory 开始执行 ===');
    console.log('1. 方法被调用，this上下文:', this);
    console.log('2. 当前product:', this.data.product);
    console.log('3. 当前showAddToFridgeModal值:', this.data.showAddToFridgeModal);
    const product = this.data.product;
    if (!product.id) {
      wx.showToast({ title: '商品信息错误', icon: 'none' });
      return;
    }
    
    // 计算保质期建议
    const suggestions = app.calculateExpirySuggestion ? app.calculateExpirySuggestion(product) : [];
    console.log('保质期建议:', suggestions);
    
    // 获取当前日期和默认过期日期
    const today = new Date();
    const todayStr = this.formatDate(today);
    
    // 计算默认过期日期（1周后）
    const defaultExpiryDate = new Date(today);
    defaultExpiryDate.setDate(today.getDate() + 7);
    const defaultExpiryDateStr = this.formatDate(defaultExpiryDate);
    
    // 如果有保质期建议，使用第一个建议日期
    let expiryDateSuggestion = defaultExpiryDateStr;
    if (suggestions && suggestions.length > 0) {
      const suggestion = suggestions.find(s => s.includes('建议过期日期'));
      if (suggestion) {
        const dateMatch = suggestion.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          expiryDateSuggestion = dateMatch[1];
        }
      }
    }
    
    this.setData({
      showAddToFridgeModal: true,
      shelfLifeSuggestions: suggestions,
      fridgeForm: {
        purchaseDate: todayStr,
        expiryDate: expiryDateSuggestion
      }
    });
    console.log('3. showAddToFridgeModal值:', this.data.showAddToFridgeModal);
  },

  // 关闭冰箱添加弹窗
  closeFridgeModal() {
    this.setData({
      showAddToFridgeModal: false,
      fridgeLoading: false,
      fridgeForm: {
        expiryDate: '',
        purchaseDate: ''
      }
    });
  },

  // 日期选择器相关方法
  showDatePicker(e) {
    const field = e.currentTarget.dataset.field;
    const currentValue = this.data.fridgeForm[field] || '';
    const title = field === 'expiryDate' ? '选择过期日期' : '选择购买日期';
    
    this.setData({
      datePickerVisible: true,
      currentDateField: field,
      datePickerTitle: title,
      datePickerValue: currentValue
    });
  },

  onDatePickerChange(e) {
    const value = e.detail.value;
    this.setData({
      datePickerValue: value
    });
  },

  confirmDatePicker() {
    const { currentDateField, datePickerValue } = this.data;
    
    if (currentDateField && datePickerValue) {
      this.setData({
        [`fridgeForm.${currentDateField}`]: datePickerValue
      });
    }
    
    this.closeDatePicker();
  },

  closeDatePicker() {
    this.setData({
      datePickerVisible: false,
      currentDateField: '',
      datePickerTitle: '选择日期',
      datePickerValue: ''
    });
  },

  // 快速设置日期
  quickSetDate(e) {
    const type = e.currentTarget.dataset.type;
    const field = this.data.currentDateField;
    
    if (!field) return;
    
    const today = new Date();
    let targetDate = new Date(today);
    
    switch (type) {
      case 'today':
        // 今天
        break;
      case 'tomorrow':
        // 明天
        targetDate.setDate(today.getDate() + 1);
        break;
      case '3days':
        // 3天后
        targetDate.setDate(today.getDate() + 3);
        break;
      case 'week':
        // 一周后
        targetDate.setDate(today.getDate() + 7);
        break;
      case 'month':
        // 一个月后
        targetDate.setMonth(today.getMonth() + 1);
        break;
      default:
        targetDate = today;
    }
    
    const formattedDate = this.formatDate(targetDate);
    this.setData({
      datePickerValue: formattedDate
    });
  },

  // 格式化日期为 YYYY-MM-DD
  formatDate(date) {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 计算天数差
  calculateDaysBetween(startDateStr, endDateStr) {
    if (!startDateStr || !endDateStr) return 0;
    
    try {
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      
      // 清除时间部分，只比较日期
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      const diffTime = endDate.getTime() - startDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      console.error('计算天数失败:', error);
      return 0;
    }
  },

  // 检查日期是否过期
  isDateExpired(dateStr) {
    if (!dateStr) return false;
    
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const targetDate = new Date(dateStr);
      targetDate.setHours(0, 0, 0, 0);
      
      return targetDate < today;
    } catch (error) {
      console.error('检查日期过期失败:', error);
      return false;
    }
  },

  // 保存到冰箱
  async saveToFridge() {
    const product = this.data.product;
    const { fridgeForm } = this.data;
    
    // 验证数据
    if (!fridgeForm.expiryDate) {
      wx.showToast({
        title: '请选择过期日期',
        icon: 'none'
      });
      return;
    }
    
    // 检查过期日期是否早于购买日期
    if (fridgeForm.purchaseDate && fridgeForm.expiryDate) {
      const purchaseDate = new Date(fridgeForm.purchaseDate);
      const expiryDate = new Date(fridgeForm.expiryDate);
      
      if (expiryDate < purchaseDate) {
        wx.showToast({
          title: '过期日期不能早于购买日期',
          icon: 'none'
        });
        return;
      }
    }
    
    this.setData({ fridgeLoading: true });
    
    try {
      const inventoryData = {
        productId: product.id,
        expiryDate: fridgeForm.expiryDate,
        purchaseDate: fridgeForm.purchaseDate || this.formatDate(new Date())
      };
      
      console.log('添加到冰箱数据:', inventoryData);
      
      await app.addToInventory(inventoryData);
      
      wx.showToast({
        title: '已添加到我的冰箱',
        icon: 'success',
        duration: 2000
      });
      
      // 关闭弹窗
      this.closeFridgeModal();
      
      // 可以跳转到冰箱页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/inventory/inventory'
        });
      }, 1500);
      
    } catch (error) {
      console.error('添加到冰箱失败:', error);
      wx.showToast({
        title: error.message || '添加失败',
        icon: 'none'
      });
    } finally {
      this.setData({ fridgeLoading: false });
    }
  },
  // 清除日期
clearDate(e) {
  const field = e.currentTarget.dataset.field;
  if (field) {
    this.setData({
      [`fridgeForm.${field}`]: ''
    });
  }
},

// 格式化日期显示
formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    
    let relativeText = '';
    if (diffDays === 0) {
      relativeText = '（今天）';
    } else if (diffDays === 1) {
      relativeText = '（明天）';
    } else if (diffDays === -1) {
      relativeText = '（昨天）';
    } else if (diffDays > 0) {
      relativeText = `（${diffDays}天后）`;
    } else if (diffDays < 0) {
      relativeText = `（${Math.abs(diffDays)}天前）`;
    }
    
    return `${year}年${month}月${day}日 星期${weekDay} ${relativeText}`;
  } catch (error) {
    console.error('格式化日期显示失败:', error);
    return dateStr;
  }
}
});