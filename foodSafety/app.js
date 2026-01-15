// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    baseURL: 'http://172.16.0.32:8080', // 确保这是你的后端地址
    env: 'prod', // 改为生产环境
    
    userProfile: null,
    currentFamilyMember: null,
    
    safetyStatusMap: {
      0: { text: '安全', color: '#2ecc71', icon: 'safe', class: 'safe' },
      1: { text: '有风险', color: '#e74c3c', icon: 'warn', class: 'risk' },
      2: { text: '高风险', color: '#c0392b', icon: 'warn', class: 'danger' }
    },
    
    riskKeywords: [
      '代可可脂', '反式脂肪酸', '苯甲酸钠', '山梨酸钾', 
      '人工色素', '阿斯巴甜', '安赛蜜', '甜蜜素', '糖精钠',
      '亚硝酸钠', '亚硫酸盐', '二氧化硫', '焦亚硫酸钠',
      '磷酸盐', '明矾', '溴酸钾', '过氧化苯甲酰'
    ],
    
    // 高风险成分（需要特别警示）
    highRiskKeywords: ['溴酸钾', '过氧化苯甲酰', '工业明胶'],
    
    // 库存状态映射
    inventoryStatusMap: {
      1: { text: '新鲜', color: '#2ecc71', icon: 'fresh' },
      2: { text: '临期', color: '#f39c12', icon: 'warn' },
      3: { text: '过期', color: '#e74c3c', icon: 'expired' }
    },
     // 帖子排序方式
     postSortOptions: [
      { value: 'latest', label: '最新', icon: 'time' },
      { value: 'hot', label: '最热', icon: 'fire' }
    ],
    // API配置
    api: {
      user: {
        login: '/user/user/login',
        profile: '/user/profile' // 获取用户画像
      },
      product: {
        scan: '/user/product/scan', // 扫码查询接口
        list: '/user/product/list', // 搜索接口
        favorite: '/user/product/favorite' // 收藏接口
      },
      history: {
        list: '/user/history/list',
        clear: '/user/history/clear'
      },
      inventory: {
        add: '/user/inventory',       // 添加到库存
        list: '/user/inventory/list', // 获取库存列表
        delete: '/user/inventory'     // 删除库存商品
      },
      community: {
        post: '/user/community/post',     // 发布帖子
        feed: '/user/community/feed',     // 获取帖子列表
        like: '/user/community/like',     // 点赞帖子
      },
      ai: {
        ocr: '/user/ai/ocr',              // OCR识别
        analyze: '/user/ai/analyze'       // AI健康分析
      }
    }
  },

  onLaunch(options) {
    console.log('小程序启动', options);
    
    // 检查登录状态
    this.checkAuthStatus();
    
    // 获取系统信息
    this.getSystemInfo();

    // 如果已登录，加载用户画像
    if (wx.getStorageSync('token')) {
      this.getUserProfile();
    }
  },

  // 检查认证状态
  checkAuthStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo;
      this.globalData.isLoggedIn = true;
      console.log('已登录，token:', token.substring(0, 20) + '...');
    } else {
      console.log('未登录，需要跳转到登录页');
      this.globalData.isLoggedIn = false;
    }
  },
   // 统一的请求方法（可以替换原有的分散请求）
   async request(url, method = 'GET', data = {}, showLoading = true) {
    return new Promise((resolve, reject) => {
      // 构建请求头
      const header = {
        'content-type': 'application/json'
      };
      
      // 添加认证信息
      const token = wx.getStorageSync('token');
      if (token) {
        header['authentication'] = token;
      }
      
      // 显示加载
      if (showLoading) {
        wx.showLoading({ title: '加载中...', mask: true });
      }
      
      wx.request({
        url: `${this.globalData.baseURL}${url}`,
        method: method,
        data: data,
        header: header,
        timeout: 15000,
        
        success: (res) => {
          console.log(`请求成功 [${method}] ${url}:`, res.data);
          
          if (showLoading) {
            wx.hideLoading();
          }
          
          if (res.statusCode === 200) {
            const responseData = res.data;
            
            if (responseData.code === 1) {
              resolve(responseData.data || null);
            } else {
              // 业务逻辑错误
              const error = new Error(responseData.msg || '请求失败');
              error.code = responseData.code;
              reject(error);
            }
          } else if (res.statusCode === 401) {
            this.clearLoginInfo();
            reject(new Error('登录已过期，请重新登录'));
          } else if (res.statusCode === 404) {
            reject(new Error('接口不存在'));
          } else if (res.statusCode >= 500) {
            reject(new Error('服务器繁忙，请稍后重试'));
          } else {
            reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          }
        },
        
        fail: (err) => {
          console.error('请求失败:', err);
          
          if (showLoading) {
            wx.hideLoading();
          }
          
          if (err.errMsg.includes('timeout')) {
            reject(new Error('请求超时，请检查网络后重试'));
          } else if (err.errMsg.includes('fail')) {
            reject(new Error('网络请求失败，请检查网络连接'));
          } else {
            reject(new Error('请求失败: ' + err.errMsg));
          }
        }
      });
    });
  },

  // 登录方法（供页面调用）
  login() {
    return new Promise((resolve, reject) => {
      wx.showLoading({
        title: '登录中...',
        mask: true
      });

      // 1. 获取code
      wx.login({
        timeout: 5000,
        success: (loginRes) => {
          if (loginRes.code) {
            console.log('获取到code:', loginRes.code);
            
            // 2. 调用后端登录接口
            wx.request({
              url: `${this.globalData.baseURL}${this.globalData.api.user.login}`,
              method: 'POST',
              data: {
                code: loginRes.code
              },
              header: {
                'content-type': 'application/json'
              },
              success: (res) => {
                wx.hideLoading();
                
                if (res.statusCode === 200 && res.data.code === 1) {
                  const data = res.data.data;
                  
                  // 3. 保存登录信息
                  this.saveLoginInfo(data);
                  
                  // 4. 获取用户信息
                  this.getUserProfile().then(userInfo => {
                    resolve({
                      ...data,
                      userInfo: userInfo
                    });
                  }).catch(err => {
                    // 获取用户信息失败，但仍然登录成功
                    resolve(data);
                  });
                  
                } else {
                  console.error('登录失败:', res.data);
                  reject(new Error(res.data.msg || '登录失败'));
                }
              },
              fail: (err) => {
                wx.hideLoading();
                console.error('网络请求失败:', err);
                reject(new Error('网络连接失败'));
              }
            });
          } else {
            wx.hideLoading();
            console.error('获取code失败:', loginRes.errMsg);
            reject(new Error('获取登录凭证失败'));
          }
        },
        fail: (err) => {
          wx.hideLoading();
          console.error('wx.login失败:', err);
          reject(new Error('微信登录失败'));
        }
      });
    });
  },

  // 保存登录信息
  saveLoginInfo(data) {
    const token = data.token;
    
    // 保存token
    wx.setStorageSync('token', token);
    this.globalData.token = token;
    this.globalData.isLoggedIn = true;
    
    // 保存用户ID
    if (data.id) {
      wx.setStorageSync('userId', data.id);
    }
    
    // 保存openid
    if (data.openid) {
      wx.setStorageSync('openid', data.openid);
    }
    
    console.log('登录信息保存成功');
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        success: (res) => {
          const userInfo = res.userInfo;
          wx.setStorageSync('userInfo', userInfo);
          this.globalData.userInfo = userInfo;
          resolve(userInfo);
        },
        fail: (err) => {
          console.error('获取用户信息失败:', err);
          reject(err);
        }
      });
    });
  },

  // 检查是否需要登录
  checkLogin() {
    return new Promise((resolve, reject) => {
      if (this.globalData.isLoggedIn) {
        resolve(true);
      } else {
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
            reject(false);
          }
        });
      }
    });
  },

  // 退出登录
  logout() {
    return new Promise((resolve) => {
      wx.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 清除本地存储
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
            wx.removeStorageSync('userId');
            wx.removeStorageSync('openid');
            
            // 清除全局数据
            this.globalData.token = null;
            this.globalData.userInfo = null;
            this.globalData.isLoggedIn = false;
            
            // 跳转到登录页
            wx.reLaunch({
              url: '/pages/login/login'
            });
            
            wx.showToast({
              title: '已退出登录',
              icon: 'success'
            });
            
            resolve(true);
          }
        }
      });
    });
  },

  // ==================== 扫码查询功能 ====================

  // 原有的扫码查询方法保持兼容性
  scanProduct(barcode) {
    return this.scanProductDetail(barcode);
  },

   // 扫码查询商品详情（更新后的方法）
   async scanProductDetail(barcode) {
    console.log('开始扫码查询，条形码:', barcode);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    try {
      // 调用扫码接口
      const productData = await this.request(`/user/product/scan/${barcode}`, 'GET');
      
      if (productData) {
        // 处理商品数据（包含个性化分析）
        return await this.processProductDataWithProfile(productData);
      }
      return null;
      
    } catch (error) {
      console.error('扫码查询失败:', error);
      
      // 处理特定的错误码
      if (error.message && error.message.includes('40401')) {
        throw new Error('库中暂无该商品信息，请尝试AI识别');
      }
      throw error;
    }
  },

  // 清除登录信息
  clearLoginInfo() {
    // 清除本地存储
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('userId');
    wx.removeStorageSync('openid');
    
    // 清除全局数据
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
    
    console.log('登录信息已清除');
  },

  // 基础的商品数据处理方法
processProductData(productData) {
  console.log('基础商品数据处理:', productData);
  
  if (!productData) return {};
  
  const product = { ...productData };
  
  // 确保必要字段存在
  product.id = product.id || product.productId;
  product.name = product.name || '未知商品';
  product.image = product.image || '/assets/images/default-food.png';
  product.safetyStatus = product.safetyStatus || 'SAFE';
  product.riskLevel = product.riskLevel || 0;
  product.ingredientList = product.ingredientList || [];
  product.riskMsg = product.riskMsg || '';
  
  // 获取安全信息
  const safetyInfo = this.getSafetyInfo ? this.getSafetyInfo(product.safetyStatus) : {
    text: product.safetyStatus === 'SAFE' ? '安全' : '有风险',
    color: product.safetyStatus === 'SAFE' ? '#2ecc71' : '#e74c3c',
    icon: product.safetyStatus === 'SAFE' ? 'safe' : 'warn'
  };
  
  // 添加处理后的字段
  return {
    ...product,
    safetyInfo: safetyInfo,
    safetyColor: safetyInfo.color,
    safetyText: safetyInfo.text,
    safetyIcon: safetyInfo.icon,
    isSafe: product.safetyStatus === 'SAFE',
    hasRisk: product.safetyStatus !== 'SAFE',
    riskLevelText: product.riskLevel === 0 ? '安全' : product.riskLevel === 1 ? '有风险' : '高风险',
    displayTime: product.updateTime ? this.formatTime ? this.formatTime(product.updateTime, 'MM-DD HH:mm') : product.updateTime : ''
  };
},
   // 处理商品数据（包含用户画像分析）
   async processProductDataWithProfile(productData) {
    console.log('处理商品数据（含个性化分析）:', productData);
    
    // 基础的商品数据处理
    const basicData = this.processProductData(productData);
    
    try {
      // 获取当前用户画像
      let currentProfile = this.globalData.userProfile;
      if (!currentProfile) {
        currentProfile = await this.getUserProfile();
      }
      
      // 获取当前家庭成员信息
      const currentFamilyMember = this.globalData.currentFamilyMember;
      
      // 进行个性化分析
      if (currentProfile || currentFamilyMember) {
        return this.performPersonalizedAnalysis(basicData, currentProfile, currentFamilyMember);
      }
      
      return basicData;
      
    } catch (error) {
      console.error('个性化分析失败:', error);
      return basicData;
    }
  },

  // 执行个性化分析
  performPersonalizedAnalysis(productData, userProfile, familyMember) {
    const product = { ...productData };
    
    // 优先使用家庭成员信息，如果没有则使用用户本人信息
    const profile = familyMember || userProfile;
    
    if (!profile) {
      return product;
    }
    
    // 获取过敏原信息
    const allergens = profile.allergens || [];
    const ingredientList = product.ingredientList || [];
    
    // 检查配料表中是否包含过敏原
    const matchedAllergens = [];
    for (const allergen of allergens) {
      for (const ingredient of ingredientList) {
        if (ingredient.includes(allergen)) {
          matchedAllergens.push(allergen);
          break;
        }
      }
    }
    
    // 如果发现过敏原，调整安全状态
    if (matchedAllergens.length > 0) {
      product.safetyStatus = 'RISK';
      product.riskLevel = 1;
      product.riskMsg = `警告：含有${familyMember ? '家人' : '您'}设置的过敏原【${matchedAllergens.join('、')}】`;
      
      // 更新安全信息
      const safetyInfo = this.getSafetyInfo('RISK');
      product.safetyInfo = safetyInfo;
      product.safetyColor = safetyInfo.color;
      product.safetyText = safetyInfo.text;
      product.safetyIcon = safetyInfo.icon;
      product.isSafe = false;
      product.hasRisk = true;
      product.riskLevelText = '有风险';
    }
    
    // 记录个性化分析的来源
    product.profileSource = familyMember ? 'family' : 'user';
    product.profileName = familyMember ? familyMember.name : '本人';
    product.matchedAllergens = matchedAllergens;
    
    return product;
  },

  // 获取安全信息
  getSafetyInfo(safetyStatus) {
    const status = safetyStatus || 'SAFE';
    
    // 将SAFE/RISK/DANGER映射到风险等级
    let riskLevel;
    if (status === 'DANGER') {
      riskLevel = 2;
    } else if (status === 'RISK') {
      riskLevel = 1;
    } else {
      riskLevel = 0;
    }
    
    return {
      status,
      level: riskLevel,
      ...(this.globalData.safetyStatusMap[riskLevel] || this.globalData.safetyStatusMap[0])
    };
  },

  // 格式化时间
  formatTime(dateString, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const hour = date.getHours();
      const minute = date.getMinutes();
      const second = date.getSeconds();

      const pad = n => n.toString().padStart(2, '0');

      return format
        .replace('YYYY', year)
        .replace('MM', pad(month))
        .replace('DD', pad(day))
        .replace('HH', pad(hour))
        .replace('mm', pad(minute))
        .replace('ss', pad(second));
    } catch (e) {
      console.error('格式化时间失败:', e);
      return dateString;
    }
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync();
      this.globalData.systemInfo = systemInfo;
      this.globalData.statusBarHeight = systemInfo.statusBarHeight || 20;
      console.log('系统信息:', systemInfo);
    } catch (error) {
      console.error('获取系统信息失败:', error);
    }
  },

  // ==================== 历史记录功能 ====================

  // 获取扫描历史记录
  async getScanHistory() {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      if (!token) {
        reject(new Error('请先登录'));
        return;
      }
      
      wx.request({
        url: `${this.globalData.baseURL}/user/history/list`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'authentication': token
        },
        timeout: 10000,
        success: (res) => {
          console.log('获取历史记录响应:', res);
          
          if (res.statusCode === 200) {
            const responseData = res.data;
            
            if (responseData.code === 1) {
              resolve(responseData.data.records || []);
            } else if (responseData.code === 0) {
              resolve([]); // 无历史记录时返回空数组
            } else {
              reject(new Error(responseData.msg || '获取历史记录失败'));
            }
          } else if (res.statusCode === 401) {
            this.clearLoginInfo();
            reject(new Error('登录已过期，请重新登录'));
          } else {
            reject(new Error(`获取历史记录失败，状态码: ${res.statusCode}`));
          }
        },
        fail: (err) => {
          console.error('获取历史记录请求失败:', err);
          reject(new Error('网络请求失败'));
        }
      });
    });
  },

  // ==================== 模糊搜索功能 ====================

// 关键词搜索商品
searchProducts(keyword) {
  return new Promise((resolve, reject) => {
    console.log('开始搜索商品，关键词:', keyword);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      reject(new Error('请先登录'));
      return;
    }
    
    if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
      reject(new Error('请输入搜索关键词'));
      return;
    }
    
    const cleanKeyword = keyword.trim();
    
    wx.request({
      url: `${this.globalData.baseURL}/user/product/list`,
      method: 'GET',
      data: {
        name: cleanKeyword
      },
      header: {
        'content-type': 'application/json',
        'authentication': token
      },
      timeout: 10000,
      
      success: async (res) => {  // 改为 async 函数
        console.log('搜索响应:', res);
        
        if (res.statusCode === 200) {
          const responseData = res.data;
          
          if (responseData.code === 1) {
            try {
              // 获取记录
              const records = responseData.data?.records || [];
              console.log('原始记录数:', records.length);
              
              if (records.length === 0) {
                resolve([]);
                return;
              }
              
              // 使用 Promise.all 等待所有异步处理完成
              const processedResults = await Promise.all(
                records.map(async (product) => {
                  try {
                    // 先进行基础处理
                    const basicData = this.processProductData(product);
                    
                    // 尝试进行个性化分析
                    if (this.processProductDataWithProfile) {
                      return await this.processProductDataWithProfile(basicData);
                    }
                    
                    return basicData;
                  } catch (error) {
                    console.error('处理商品失败:', error);
                    // 返回基础数据作为备选
                    return this.processProductData ? this.processProductData(product) : product;
                  }
                })
              );
              
              console.log('处理后的搜索结果:', processedResults);
              resolve(processedResults);
              
            } catch (error) {
              console.error('处理搜索结果失败:', error);
              // 如果异步处理失败，返回原始数据
              const records = responseData.data?.records || [];
              const basicResults = records.map(product => 
                this.processProductData ? this.processProductData(product) : product
              );
              resolve(basicResults);
            }
            
          } else {
            reject(new Error(responseData.msg || '搜索失败'));
          }
        } else if (res.statusCode === 401) {
          this.clearLoginInfo();
          reject(new Error('登录已过期，请重新登录'));
        } else if (res.statusCode === 404) {
          reject(new Error('搜索接口不存在'));
        } else {
          reject(new Error(`搜索失败，状态码: ${res.statusCode}`));
        }
      },
      
      fail: (err) => {
        console.error('搜索请求失败:', err);
        
        if (err.errMsg.includes('timeout')) {
          reject(new Error('请求超时，请检查网络后重试'));
        } else {
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      }
    });
  });
},

  // ==================== 获取历史记录功能 ====================

// 清空所有历史记录
clearAllHistory() {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    if (!token) {
      reject(new Error('请先登录'));
      return;
    }
    
    console.log('开始清空历史记录');
    
    wx.request({
      url: `${this.globalData.baseURL}/user/history/clear`,
      method: 'DELETE',
      header: {
        'content-type': 'application/json',
        'authentication': token
      },
      timeout: 10000,
      
      success: (res) => {
        console.log('清空历史记录响应:', res);
        
        if (res.statusCode === 200) {
          const responseData = res.data;
          
          if (responseData.code === 1) {
            console.log('清空历史记录成功');
            resolve(true);
          } else {
            reject(new Error(responseData.msg || '清空失败'));
          }
        } else if (res.statusCode === 401) {
          this.clearLoginInfo();
          reject(new Error('登录已过期，请重新登录'));
        } else {
          reject(new Error(`清空失败，状态码: ${res.statusCode}`));
        }
      },
      
      fail: (err) => {
        console.error('清空历史记录请求失败:', err);
        
        if (err.errMsg.includes('timeout')) {
          reject(new Error('请求超时，请检查网络后重试'));
        } else {
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      }
    });
  });
},

// 删除历史记录（如果需要）
deleteScanHistory(id) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    if (!token) {
      reject(new Error('请先登录'));
      return;
    }
    
    wx.request({
      url: `${this.globalData.baseURL}/user/history/clear`,
      method: 'DELETE',
      header: {
        'content-type': 'application/json',
        'authentication': token
      },
      success: (res) => {
        if (res.data.code === 1) {
          resolve(true);
        } else {
          reject(new Error(res.data.msg || '删除失败'));
        }
      },
      fail: reject
    });
  });
},

  // 批量处理商品数据（用于搜索结果）
  processProductsList(products) {
    if (!Array.isArray(products)) {
      return [];
    }
    
    return products.map(product => this.processProductData(product));
  },
  // 检查网络状态
  checkNetworkStatus() {
    return new Promise((resolve) => {
      wx.getNetworkType({
        success: (res) => {
          const networkType = res.networkType;
          resolve({
            isConnected: networkType !== 'none',
            networkType: networkType
          });
        },
        fail: () => {
          resolve({
            isConnected: false,
            networkType: 'unknown'
          });
        }
      });
    });
  },

   // ==================== 用户画像相关 ====================

  // 获取用户画像
  async getUserProfile() {
    try {
      const token = wx.getStorageSync('token');
      if (!token) {
        return null;
      }

      const res = await this.request('/user/profile', 'GET');
      
      if (res) {
        this.globalData.userProfile = res;
        wx.setStorageSync('userProfile', res);
        return res;
      }
      return null;
    } catch (error) {
      console.error('获取用户画像失败:', error);
      return null;
    }
  },

  // 保存用户画像
  async saveUserProfile(profileData) {
    try {
      const res = await this.request('/user/profile', 'POST', profileData);
      
      if (res) {
        this.globalData.userProfile = profileData;
        wx.setStorageSync('userProfile', profileData);
      }
      return res;
    } catch (error) {
      console.error('保存用户画像失败:', error);
      throw error;
    }
  },

   // ==================== 商品收藏功能 ====================

  // 收藏/取消收藏商品
  async toggleProductFavorite(productId) {
    console.log('收藏/取消收藏商品，商品ID:', productId);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    try {
      // 调用收藏接口
      const result = await this.request('/user/product/favorite', 'POST', {
        productId: productId
      });
      
      console.log('收藏操作结果:', result);
      return result; // 返回当前状态：true=已收藏，false=未收藏
      
    } catch (error) {
      console.error('收藏操作失败:', error);
      throw error;
    }
  },

  // 检查商品是否已收藏
  async checkProductFavorite(productId) {
    try {
      const favorites = wx.getStorageSync('favorites') || [];
      return favorites.includes(productId);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      return false;
    }
  },

  // 获取收藏列表（从本地缓存）
  getFavoritesList() {
    try {
      const favorites = wx.getStorageSync('favorites') || [];
      return favorites;
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      return [];
    }
  },

  // 更新本地收藏状态
  updateLocalFavorite(productId, isFavorite) {
    try {
      let favorites = wx.getStorageSync('favorites') || [];
      
      if (isFavorite) {
        // 添加到收藏
        if (!favorites.includes(productId)) {
          favorites.push(productId);
        }
      } else {
        // 从收藏中移除
        favorites = favorites.filter(id => id !== productId);
      }
      
      wx.setStorageSync('favorites', favorites);
      console.log('本地收藏列表已更新:', favorites);
      return true;
      
    } catch (error) {
      console.error('更新本地收藏失败:', error);
      return false;
    }
  },

   // ==================== 库存管理功能 ====================

  // 添加商品到库存（我的冰箱）
  async addToInventory(inventoryData) {
    console.log('添加到库存，数据:', inventoryData);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    // 验证必填字段
    if (!inventoryData.productId) {
      throw new Error('商品ID不能为空');
    }
    
    if (!inventoryData.expiryDate) {
      throw new Error('过期日期不能为空');
    }
    
    try {
      const result = await this.request('/user/inventory', 'POST', inventoryData);
      console.log('添加到库存成功:', result);
      return result;
      
    } catch (error) {
      console.error('添加到库存失败:', error);
      throw error;
    }
  },

  // 获取库存列表
  async getInventoryList(status = null) {
    console.log('获取库存列表，状态:', status);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    try {
      const params = {};
      if (status) {
        params.status = status;
      }
      
      const inventoryList = await this.request('/user/inventory/list', 'GET', params, false);
      console.log('获取库存列表原始结果:', inventoryList);
      console.log('获取库存列表成功:', inventoryList.length || 0, '条记录');
      
      // 处理库存数据
      const processedList = (inventoryList.records || []).map(item => 
        this.processInventoryItem(item)
      );
      
      return processedList;
      
    } catch (error) {
      console.error('获取库存列表失败:', error);
      throw error;
    }
  },

  // 删除库存商品
  async deleteInventoryItem(inventoryId) {
    console.log('删除库存商品，ID:', inventoryId);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    try {
      const result = await this.request(`/user/inventory/${inventoryId}`, 'DELETE');
      console.log('删除库存商品成功:', result);
      return result;
      
    } catch (error) {
      console.error('删除库存商品失败:', error);
      throw error;
    }
  },

  // 更新库存商品（如修改日期等）
  async updateInventoryItem(inventoryId, updateData) {
    console.log('更新库存商品，ID:', inventoryId, '数据:', updateData);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    try {
      const result = await this.request(`/user/inventory/${inventoryId}`, 'PUT', updateData);
      console.log('更新库存商品成功:', result);
      return result;
      
    } catch (error) {
      console.error('更新库存商品失败:', error);
      throw error;
    }
  },

  // 处理库存商品数据
  processInventoryItem(item) {
    if (!item) return null;
    
    const remainingDays = item.remainingDays || 0;
    const status = item.status || 1;
    
    // 获取状态信息
    const statusInfo = this.globalData.inventoryStatusMap[status] || 
                      this.globalData.inventoryStatusMap[1];
    
    // 根据剩余天数计算状态
    let calculatedStatus = status;
    let statusMsg = item.statusMsg || '';
    
    if (remainingDays < 0) {
      calculatedStatus = 3; // 过期
      statusMsg = '已过期，请丢弃';
    } else if (remainingDays <= 3) {
      calculatedStatus = 2; // 临期
      statusMsg = '即将过期，请尽快食用';
    } else {
      calculatedStatus = 1; // 新鲜
      statusMsg = '新鲜';
    }
    
    // 处理过期日期显示
    const expiryDate = item.expiryDate || '';
    let displayDate = expiryDate;
    let daysText = '';
    
    if (expiryDate) {
      try {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 0) {
          daysText = `已过期 ${Math.abs(diffDays)} 天`;
        } else if (diffDays === 0) {
          daysText = '今天过期';
        } else {
          daysText = `剩余 ${diffDays} 天`;
        }
        
        // 格式化日期显示
        const month = expiry.getMonth() + 1;
        const day = expiry.getDate();
        displayDate = `${month}月${day}日`;
        
      } catch (error) {
        console.error('处理过期日期失败:', error);
      }
    }
    
    return {
      id: item.id,
      productId: item.productId,
      productName: item.productName || '未知商品',
      image: item.image || '/assets/images/default-food.png',
      expiryDate: expiryDate,
      displayDate: displayDate,
      remainingDays: remainingDays,
      daysText: daysText,
      status: calculatedStatus,
      statusMsg: statusMsg,
      statusColor: statusInfo.color,
      statusText: statusInfo.text,
      statusIcon: statusInfo.icon,
      purchaseDate: item.purchaseDate || '',
      addTime: item.addTime || '',
      displayTime: this.formatTime(item.addTime, 'MM-DD')
    };
  },

  // 获取库存统计
  async getInventoryStats() {
    try {
      const inventoryList = await this.getInventoryList();
      
      const stats = {
        total: inventoryList.length,
        fresh: 0,
        expiring: 0,
        expired: 0
      };
      
      inventoryList.forEach(item => {
        if (item.status === 1) {
          stats.fresh++;
        } else if (item.status === 2) {
          stats.expiring++;
        } else if (item.status === 3) {
          stats.expired++;
        }
      });
      
      return stats;
      
    } catch (error) {
      console.error('获取库存统计失败:', error);
      return {
        total: 0,
        fresh: 0,
        expiring: 0,
        expired: 0
      };
    }
  },

  // 计算保质期建议
  calculateExpirySuggestion(product, productionDate = null) {
    if (!product) return null;
    
    const suggestions = [];
    
    // 如果有保质期信息
    if (product.shelfLife) {
      suggestions.push(`商品标注保质期：${product.shelfLife}`);
    }
    
    // 如果是常见食品类型，提供建议
    const foodType = this.detectFoodType(product.name);
    if (foodType) {
      const suggestion = this.getFoodExpirySuggestion(foodType);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }
    
    // 计算建议过期日期
    const suggestedExpiry = this.suggestExpiryDate(product, productionDate);
    if (suggestedExpiry) {
      suggestions.push(`建议过期日期：${suggestedExpiry}`);
    }
    
    return suggestions.length > 0 ? suggestions : ['请参考商品包装上的保质期信息'];
  },

  // 检测食品类型
  detectFoodType(productName) {
    const name = productName.toLowerCase();
    
    if (name.includes('牛奶') || name.includes('酸奶') || name.includes('奶酪')) {
      return 'dairy';
    } else if (name.includes('肉') || name.includes('肠') || name.includes('火腿')) {
      return 'meat';
    } else if (name.includes('面包') || name.includes('蛋糕') || name.includes('糕点')) {
      return 'bakery';
    } else if (name.includes('饮料') || name.includes('果汁') || name.includes('水')) {
      return 'beverage';
    } else if (name.includes('零食') || name.includes('饼干') || name.includes('薯片')) {
      return 'snack';
    } else if (name.includes('冷冻') || name.includes('冰淇淋')) {
      return 'frozen';
    }
    
    return null;
  },

  // 获取食品过期建议
  getFoodExpirySuggestion(foodType) {
    const suggestions = {
      dairy: '乳制品开封后建议7天内食用完',
      meat: '肉类建议3天内食用，冷冻保存可延长保质期',
      bakery: '烘焙食品建议2-3天内食用完',
      beverage: '饮料开封后建议当天饮用完',
      snack: '零食一般保质期较长，但开封后建议尽快食用',
      frozen: '冷冻食品可保存较长时间，但建议3个月内食用'
    };
    
    return suggestions[foodType] || null;
  },

  // 建议过期日期
  suggestExpiryDate(product, productionDate) {
    const today = new Date();
    let expiryDate = new Date(today);
    
    // 根据保质期信息调整
    if (product.shelfLife) {
      const shelfLife = this.parseShelfLife(product.shelfLife);
      if (shelfLife.days) {
        expiryDate.setDate(today.getDate() + shelfLife.days);
      }
    } else if (productionDate) {
      // 如果有生产日期，根据食品类型建议
      const foodType = this.detectFoodType(product.name);
      const expiryDays = {
        dairy: 7,
        meat: 3,
        bakery: 3,
        beverage: 1,
        snack: 30,
        frozen: 90
      };
      
      const days = expiryDays[foodType] || 7;
      expiryDate.setDate(today.getDate() + days);
    }
    
    // 格式化日期
    const year = expiryDate.getFullYear();
    const month = expiryDate.getMonth() + 1;
    const day = expiryDate.getDate();
    
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  },

  // 解析保质期字符串
  parseShelfLife(shelfLife) {
    const result = { days: 0, text: shelfLife };
    
    try {
      // 匹配数字+单位
      const match = shelfLife.match(/(\d+)\s*(天|日|月|年)/);
      if (match) {
        const num = parseInt(match[1]);
        const unit = match[2];
        
        switch (unit) {
          case '天':
          case '日':
            result.days = num;
            break;
          case '月':
            result.days = num * 30;
            break;
          case '年':
            result.days = num * 365;
            break;
        }
      }
    } catch (error) {
      console.error('解析保质期失败:', error);
    }
    
    return result;
  },
  // app.js 中添加消耗库存商品的方法
// 标记库存商品为已消耗
async consumeInventoryItem(inventoryId) {
  console.log('标记库存商品为已消耗，ID:', inventoryId);
  
  const token = wx.getStorageSync('token');
  if (!token) {
    throw new Error('请先登录');
  }
  
  try {
    const result = await this.request(`/user/inventory/${inventoryId}/consume`, 'PATCH');
    console.log('标记消耗成功:', result);
    return result;
    
  } catch (error) {
    console.error('标记消耗失败:', error);
    throw error;
  }
},

 // ==================== 社区互动功能（仅现有API） ====================

  // 发布帖子
  async createPost(postData) {
    console.log('发布帖子，数据:', postData);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    // 验证必填字段
    if (!postData.content || postData.content.trim() === '') {
      throw new Error('帖子内容不能为空');
    }
    
    // 内容长度限制
    if (postData.content.length > 1000) {
      throw new Error('内容长度不能超过1000字');
    }
    
    // 标题可选，如果有则限制长度
    if (postData.title && postData.title.length > 50) {
      throw new Error('标题长度不能超过50字');
    }
    
    // 图片验证（如果有的话）
    if (postData.images && !Array.isArray(postData.images)) {
      throw new Error('图片格式错误');
    }
    
    try {
      // 使用统一的请求方法
      const result = await this.request('/user/community/post', 'POST', postData);
      console.log('发布帖子成功:', result);
      return result;
      
    } catch (error) {
      console.error('发布帖子失败:', error);
      throw error;
    }
  },

  // 获取帖子列表（分页）
  async getPostFeed(params = {}) {
    console.log('获取帖子列表，参数:', params);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    try {
      const defaultParams = {
        page: 1,
        pageSize: 10,
        sort: 'latest'
      };
      
      const requestParams = { ...defaultParams, ...params };
      const result = await this.request('/user/community/feed', 'GET', requestParams, false);
      
      console.log('获取帖子列表成功，总数:', result?.total || 0);
      
      // 处理帖子数据
      const processedList = (result.records || []).map(post => 
        this.processPostData(post)
      );
      
      return {
        list: processedList,
        total: result?.total || 0,
        page: result?.page || 1,
        pageSize: result?.pageSize || 10,
        hasMore: processedList.length >= (result?.pageSize || 10)
      };
      
    } catch (error) {
      console.error('获取帖子列表失败:', error);
      throw error;
    }
  },

  // 点赞/取消点赞帖子
  async togglePostLike(postId, isLike) {
    console.log('点赞操作，帖子ID:', postId, '是否点赞:', isLike);
    
    const token = wx.getStorageSync('token');
    if (!token) {
      throw new Error('请先登录');
    }
    
    try {
      const result = await this.request('/user/community/like', 'POST', {
        postId: postId,
        isLike: isLike
      });
      
      console.log('点赞操作成功:', result);
      return result;
      
    } catch (error) {
      console.error('点赞操作失败:', error);
      throw error;
    }
  },

  // 处理帖子数据（简化版）
  processPostData(post) {
    if (!post) return null;
    
    // 处理用户信息（简化处理）
    const userInfo = post.user || {};
    const avatar = userInfo.avatar || '/assets/images/default-avatar.png';
    const nickname = userInfo.nickname || '食安卫士用户';
    
    // 处理图片
    const images = Array.isArray(post.images) ? post.images : [];
    
    // 处理时间显示
    const createTime = post.createTime || '';
    const displayTime = this.formatRelativeTime(createTime);
    
    // 处理点赞状态（简化，如果后端没返回，假设未点赞）
    const isLiked = post.isLiked || false;
    const likeCount = post.likeCount || 0;
    const commentCount = post.commentCount || 0;
    
    // 处理内容
    const content = post.content || '';
    const title = post.title || '';
    
    return {
      id: post.id,
      title: title,
      content: content,
      images: images,
      createTime: createTime,
      displayTime: displayTime,
      
      // 用户信息
      userId: userInfo.id || post.userId,
      userAvatar: avatar,
      userNickname: nickname,
      
      // 互动数据
      likeCount: likeCount,
      commentCount: commentCount,
      isLiked: isLiked,
      
      // 方便前端使用的字段
      hasImages: images.length > 0,
      hasTitle: !!title,
      previewContent: content.length > 100 ? content.substring(0, 100) + '...' : content
    };
  },

  // 格式化相对时间
  formatRelativeTime(dateString) {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 7) {
        // 超过7天显示具体日期
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${month}月${day}日`;
      } else if (diffDay > 0) {
        return `${diffDay}天前`;
      } else if (diffHour > 0) {
        return `${diffHour}小时前`;
      } else if (diffMin > 0) {
        return `${diffMin}分钟前`;
      } else {
        return '刚刚';
      }
    } catch (error) {
      console.error('格式化相对时间失败:', error);
      return dateString;
    }
  },

  // 统一的请求方法（需要确保这个方法存在）
  async request(url, method = 'GET', data = {}, showLoading = true) {
    return new Promise((resolve, reject) => {
      const header = {
        'content-type': 'application/json'
      };
      
      const token = wx.getStorageSync('token');
      if (token) {
        header['authentication'] = token;
      }
      
      if (showLoading) {
        wx.showLoading({ title: '加载中...', mask: true });
      }
      
      wx.request({
        url: `${this.globalData.baseURL}${url}`,
        method: method,
        data: data,
        header: header,
        timeout: 15000,
        
        success: (res) => {
          if (showLoading) {
            wx.hideLoading();
          }
          
          if (res.statusCode === 200) {
            const responseData = res.data;
            
            if (responseData.code === 1) {
              resolve(responseData.data || null);
            } else {
              reject(new Error(responseData.msg || '请求失败'));
            }
          } else if (res.statusCode === 401) {
            this.clearLoginInfo();
            reject(new Error('登录已过期，请重新登录'));
          } else {
            reject(new Error(`请求失败，状态码: ${res.statusCode}`));
          }
        },
        
        fail: (err) => {
          if (showLoading) {
            wx.hideLoading();
          }
          
          if (err.errMsg.includes('timeout')) {
            reject(new Error('请求超时，请检查网络后重试'));
          } else {
            reject(new Error('网络请求失败，请检查网络连接'));
          }
        }
      });
    });
  }
});