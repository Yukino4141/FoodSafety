// pages/search/search.js
const app = getApp();

Page({
  data: {
    // 搜索相关
    searchKeyword: '',
    searchHistory: [],
    hotSearches: [
      { keyword: '薯片', count: 1284, rank: 1 },
      { keyword: '饼干', count: 987, rank: 2 },
      { keyword: '牛奶', count: 856, rank: 3 },
      { keyword: '饮料', count: 754, rank: 4 },
      { keyword: '巧克力', count: 689, rank: 5 },
      { keyword: '方便面', count: 532, rank: 6 },
      { keyword: '酸奶', count: 487, rank: 7 },
      { keyword: '面包', count: 421, rank: 8 },
      { keyword: '糖果', count: 398, rank: 9 },
      { keyword: '矿泉水', count: 356, rank: 10 }
    ],
    
    // 搜索结果
    searchResults: [],
    loading: false,
    noResult: false,
    hasMore: true,
    
    // 分页相关
    pageIndex: 1,
    pageSize: 10,
    total: 0,
    
    // 系统信息
    statusBarHeight: 20,
    capsuleInfo: null,

    // 控制是否自动聚焦
    autoFocus: false
  },

  onLoad(options) {
    console.log('搜索页加载，参数:', options);
    
    // 获取系统信息
    this.getSystemInfo();
    
    // 加载搜索历史
    this.loadSearchHistory();
    
    // 如果有初始关键词，开始搜索
    if (options && options.keyword) {
      const keyword = decodeURIComponent(options.keyword);
      this.setData({
        searchKeyword: keyword,
        autoFocus: false // 有初始关键词时不自动聚焦
      }, () => {
        this.doSearch(keyword);
      });
    } else {
      // 没有初始关键词时不自动聚焦，避免键盘弹出
      this.setData({
        autoFocus: false
      });
    }
  },

  onShow() {
    // 每次显示时刷新搜索历史
    this.loadSearchHistory();
  },

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

  // 加载搜索历史
  loadSearchHistory() {
    const searchHistory = wx.getStorageSync('searchHistory') || [];
    this.setData({
      searchHistory: searchHistory.slice(0, 10)
    });
  },

  // 保存搜索历史
  saveSearchHistory(keyword) {
    if (!keyword || keyword.trim() === '') return;
    
    let history = wx.getStorageSync('searchHistory') || [];
    
    // 移除重复项
    history = history.filter(item => item !== keyword);
    
    // 添加到开头
    history.unshift(keyword.trim());
    
    // 限制数量
    if (history.length > 20) {
      history = history.slice(0, 20);
    }
    
    wx.setStorageSync('searchHistory', history);
    
    // 更新页面显示
    this.setData({
      searchHistory: history.slice(0, 10)
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
    this.setData({
      showSearchHistory: true
    });
  },

  // 搜索框失去焦点
  onSearchBlur() {
    setTimeout(() => {
      this.setData({
        showSearchHistory: false
      });
    }, 200);
  },

  // 搜索确认（回车）
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
      wx.showToast({
        title: '请输入搜索关键词',
        icon: 'none'
      });
      return;
    }
    
    this.doSearch(keyword);
  },

  // 执行搜索
  doSearch(keyword) {
    if (!keyword || keyword.trim() === '') {
      return;
    }
    
    const cleanKeyword = keyword.trim();
    
    // 保存搜索历史
    this.saveSearchHistory(cleanKeyword);
    
    // 隐藏搜索历史弹窗
    this.setData({
      showSearchHistory: false,
      searchKeyword: cleanKeyword
    });
    
    // 开始搜索
    this.startSearch(cleanKeyword);
  },

// 开始搜索（调用接口）
async startSearch(keyword) {
  // 显示加载
  this.setData({
    loading: true,
    noResult: false,
    searchResults: [],
    pageIndex: 1
  });
  
  wx.showLoading({
    title: '搜索中...',
    mask: true
  });
  
  try {
    // 调用搜索接口
    let results = await app.searchProducts(keyword);
    console.log('搜索结果原始:', results);
    
    // 如果结果是 Promise 数组，等待所有 Promise 完成
    if (Array.isArray(results) && results.length > 0 && results[0] instanceof Promise) {
      console.log('检测到 Promise 数组，等待解析...');
      results = await Promise.all(results);
      console.log('解析后的结果:', results);
    }
    
    // 确保每个商品都有必要字段
    const processedResults = (results || []).map((item, index) => {
      // 如果是 Promise，提取值
      if (item && typeof item.then === 'function') {
        console.warn(`第 ${index} 项仍然是 Promise，跳过`);
        return null;
      }
      
      return {
        ...item,
        // 确保有必要的字段
        id: item.id || item.productId || '',
        barcode: item.barcode || '',
        name: item.name || '未知商品',
        image: item.image || '/assets/images/default-food.png',
        safetyStatus: item.safetyStatus || 'SAFE',
        riskMsg: item.riskMsg || ''
      };
    }).filter(item => item !== null); // 过滤掉null
    
    console.log('最终处理结果:', processedResults);
    
    this.setData({
      searchResults: processedResults,
      loading: false,
      noResult: processedResults.length === 0,
      hasMore: processedResults.length >= 10
    });
    
    if (processedResults.length === 0) {
      wx.showToast({
        title: '暂无相关商品',
        icon: 'none',
        duration: 2000
      });
    }
    
  } catch (error) {
    console.error('搜索失败:', error);
    
    this.setData({
      loading: false,
      noResult: true
    });
    
    this.handleSearchError(error);
    
  } finally {
    wx.hideLoading();
  }
},

  // 处理搜索错误
  handleSearchError(error) {
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
        title: errorMsg,
        icon: 'none',
        duration: 2000
      });
      
    } else {
      // 其他错误
      wx.showToast({
        title: errorMsg || '搜索失败',
        icon: 'none',
        duration: 2000
      });
    }
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

  // 清空搜索框
  clearSearchInput() {
    this.setData({
      searchKeyword: '',
      showSearchHistory: true,
      searchResults: [],
      noResult: false
    });
  },

// 查看商品详情
viewProductDetail(e) {
  console.log('=== 点击事件详情 ===');
  
  const index = e.currentTarget.dataset.index;
  console.log('获取到的索引:', index);
  
  if (index === undefined || index === null) {
    console.error('没有获取到索引');
    return;
  }
  
  const idx = parseInt(index);
  const product = this.data.searchResults[idx];
  
  if (!product) {
    console.error('商品不存在');
    return;
  }
  
  console.log('跳转商品:', product);
  
  // 如果商品是 Promise，需要特殊处理
  if (product && typeof product.then === 'function') {
    console.warn('商品是 Promise，尝试解析...');
    product.then(resolvedProduct => {
      console.log('解析后的商品:', resolvedProduct);
      this.navigateWithProduct(resolvedProduct);
    }).catch(error => {
      console.error('解析商品 Promise 失败:', error);
      wx.showToast({
        title: '商品信息加载失败',
        icon: 'none'
      });
    });
    return;
  }
  
  // 正常跳转
  this.navigateWithProduct(product);
},

// 使用商品数据进行跳转
navigateWithProduct(product) {
  console.log('跳转商品数据:', product);
  
  // 确保 product 是对象
  if (!product || typeof product !== 'object') {
    console.error('商品数据无效:', product);
    wx.showToast({
      title: '商品信息无效',
      icon: 'none'
    });
    return;
  }
  
  // 优先使用barcode
  if (product.barcode) {
    console.log('使用商品barcode跳转:', product.barcode);
    wx.navigateTo({
      url: `/pages/detail/detail?barcode=${product.barcode}`
    });
    return;
  }
  
  // 其次使用id
  if (product.id) {
    console.log('使用商品id跳转:', product.id);
    wx.navigateTo({
      url: `/pages/detail/detail?id=${product.id}`
    });
    return;
  }
  
  // 如果都没有，显示错误
  console.error('商品没有barcode或id:', product);
  wx.showToast({
    title: '商品信息不完整',
    icon: 'none'
  });
},

  // 使用商品数据进行跳转
  navigateWithProduct(product) {
    console.log('跳转商品:', product);
    
    // 优先使用barcode
    if (product.barcode) {
      console.log('使用商品barcode跳转:', product.barcode);
      wx.navigateTo({
        url: `/pages/detail/detail?barcode=${product.barcode}`
      });
      return;
    }
    
    // 其次使用id
    if (product.id) {
      console.log('使用商品id跳转:', product.id);
      wx.navigateTo({
        url: `/pages/detail/detail?id=${product.id}`
      });
      return;
    }
    
    // 如果都没有，显示错误
    console.error('商品没有barcode或id');
    wx.showToast({
      title: '商品信息不完整',
      icon: 'none'
    });
  },

  // 上拉加载更多
  onReachBottom() {
    // 由于接口只返回最多20条，这里暂时不实现分页
    // 如果需要分页，可以根据实际情况调整
    if (this.data.hasMore && !this.data.loading) {
      console.log('加载更多...');
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    const keyword = this.data.searchKeyword.trim();
    if (keyword) {
      this.startSearch(keyword).then(() => {
        wx.stopPullDownRefresh();
      }).catch(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      wx.stopPullDownRefresh();
    }
  },

  // 返回上一页
  goBack() {
    wx.navigateBack({
      delta: 1
    });
  }
});