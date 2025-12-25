// app.js
App({
  globalData: {
    userInfo: null,
    token: null,
    isLoggedIn: false,
    baseURL: 'http://localhost:8080', // 确保这是你的后端地址
    env: 'prod', // 改为生产环境
    
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
    
    // API配置
    api: {
      user: {
        login: '/user/user/login'
      },
      product: {
        scan: '/user/product/scan', // 扫码查询接口
        history: '/user/product/history' // 历史记录接口
      }
    }
  },

  onLaunch(options) {
    console.log('小程序启动', options);
    
    // 检查登录状态
    this.checkAuthStatus();
    
    // 获取系统信息
    this.getSystemInfo();
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

  // 扫码查询商品（主要方法，供页面调用）
  scanProduct(barcode) {
    return new Promise((resolve, reject) => {
      console.log('开始扫码查询，条形码:', barcode);
      
      // 移除模拟数据判断，直接调用真实接口
      this.scanProductDetail(barcode).then(resolve).catch(reject);
    });
  },

  // 扫码查询商品详情（核心方法）
  scanProductDetail(barcode) {
    return new Promise((resolve, reject) => {
      const token = wx.getStorageSync('token');
      if (!token) {
        reject(new Error('请先登录'));
        return;
      }
      
      console.log('请求扫码查询，barcode:', barcode);
      
      wx.request({
        url: `${this.globalData.baseURL}/user/product/scan/${barcode}`,
        method: 'GET',
        header: {
          'content-type': 'application/json',
          'authentication': token
        },
        timeout: 15000,
        
        success: (res) => {
          console.log('扫码查询响应:', res);
          
          if (res.statusCode === 200) {
            const responseData = res.data;
            
            if (responseData.code === 1 && responseData.data) {
              // 查询成功，处理商品数据
              const processedData = this.processProductData(responseData.data);
              console.log('处理后的商品数据:', processedData);
              resolve(processedData);
            } else if (responseData.code === 0) {
              // 商品未收录
              reject(new Error(responseData.msg || '该商品未收录，敬请期待！'));
            } else {
              reject(new Error(responseData.msg || '查询失败'));
            }
          } else if (res.statusCode === 401) {
            // token过期或无效
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
          console.error('扫码查询请求失败:', err);
          
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

  // 处理商品数据
  processProductData(productData) {
    if (!productData) return null;
    
    console.log('原始商品数据:', productData);
    
    // 解析配料表
    let ingredientList = [];
    if (productData.ingredientList) {
      try {
        if (typeof productData.ingredientList === 'string') {
          // 尝试解析JSON字符串
          if (productData.ingredientList.startsWith('[') || 
              productData.ingredientList.startsWith('"')) {
            ingredientList = JSON.parse(productData.ingredientList);
          } else {
            // 按逗号分割
            ingredientList = productData.ingredientList.split(',')
              .map(item => item.trim())
              .filter(item => item.length > 0);
          }
        } else if (Array.isArray(productData.ingredientList)) {
          ingredientList = productData.ingredientList;
        }
      } catch (e) {
        console.error('解析配料表失败:', e);
        ingredientList = [productData.ingredientList];
      }
    }
    
    // 获取安全信息
    const safetyInfo = this.getSafetyInfo(productData.safetyStatus);
    
    // 构建完整商品信息
    const processedData = {
      // 原始数据
      id: productData.id,
      barcode: productData.barcode,
      name: productData.name || '未知商品',
      image: productData.image || '/assets/images/default-food.png',
      ingredientList: ingredientList,
      safetyStatus: productData.safetyStatus || 'SAFE',
      riskMsg: productData.riskMsg || null,
      riskLevel: productData.riskLevel || 0,
      updateTime: productData.updateTime,
      
      // 格式化时间
      displayTime: this.formatTime(productData.updateTime, 'MM-DD HH:mm'),
      fullTime: this.formatTime(productData.updateTime),
      
      // 安全信息
      safetyInfo: safetyInfo,
      isSafe: (productData.safetyStatus || 'SAFE') === 'SAFE',
      hasRisk: (productData.safetyStatus === 'RISK' || productData.safetyStatus === 'DANGER'),
      
      // 方便前端使用的字段
      safetyColor: safetyInfo.color,
      safetyText: safetyInfo.text,
      safetyIcon: safetyInfo.icon,
      
      // 风险等级文本
      riskLevelText: productData.riskLevel === 2 ? '高风险' : 
                    productData.riskLevel === 1 ? '有风险' : '安全'
    };
    
    console.log('处理后的商品数据:', processedData);
    return processedData;
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
  getScanHistory() {
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
              resolve(responseData.data || []);
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
        
        success: (res) => {
          console.log('搜索响应:', res);
          
          if (res.statusCode === 200) {
            const responseData = res.data;
            
            if (responseData.code === 1) {
              // 处理搜索结果
              const processedResults = (responseData.data || []).map(product => 
                this.processProductData(product)
              );
              console.log('处理后的搜索结果:', processedResults);
              resolve(processedResults);
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

  // app.js - 在 App 对象中添加

// 获取扫描历史记录
getScanHistory() {
  return new Promise((resolve, reject) => {
    console.log('开始获取扫描历史记录');
    
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
            // 处理历史记录数据
            const processedHistory = (responseData.data || []).map(item => 
              this.processProductData(item)
            );
            console.log('处理后的历史记录:', processedHistory.length, '条');
            resolve(processedHistory);
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
        
        if (err.errMsg.includes('timeout')) {
          reject(new Error('请求超时，请检查网络后重试'));
        } else {
          reject(new Error('网络请求失败，请检查网络连接'));
        }
      }
    });
  });
},

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
  }
});