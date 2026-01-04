// pages/login/login.js
const app = getApp();

Page({
  data: {
    loading: false,
    loadingText: '登录中...',
    agreed: false,
    showAgreementModal: false,
    modalTitle: '',
    modalContent: '',
    loginError: ''
  },

  onLoad(options) {
    console.log('登录页加载', options);
    
    // 检查是否已登录，如果已登录则跳转到首页
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      console.log('已登录，跳转到首页');
      this.navigateToHome();
    }
  },

  // 处理登录按钮点击
  handleLogin(e) {
    console.log('登录按钮点击:', e);
    
    // 检查协议是否同意
    if (!this.data.agreed) {
      wx.showToast({
        title: '请先阅读并同意协议',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 开始登录流程
    this.startLoginProcess();
  },

  // 开始登录流程
  async startLoginProcess() {
    this.setData({
      loading: true,
      loadingText: '登录中...',
      loginError: ''
    });

    try {
      // 第一步：获取微信登录code
      const loginRes = await this.wxLogin();
      console.log('获取到code:', loginRes.code);
      
      // 第二步：获取用户信息（需要用户授权）
      const userInfo = await this.getUserProfile();
      console.log('用户信息:', userInfo);
      
      // 第三步：调用后端登录接口
      const loginData = await this.callLoginAPI(loginRes.code, userInfo);
      console.log('登录成功:', loginData);
      
      // 第四步：保存登录信息
      this.saveLoginInfo(loginData, userInfo);
      
      // 第五步：登录成功，跳转到首页
      await this.loginSuccess();
      
    } catch (error) {
      console.error('登录失败:', error);
      this.handleLoginError(error);
    } finally {
      this.setData({ loading: false });
    }
  },

  // 微信登录获取code
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        timeout: 10000,
        success: (res) => {
          if (res.code) {
            resolve(res);
          } else {
            reject(new Error('获取登录凭证失败: ' + res.errMsg));
          }
        },
        fail: (err) => {
          reject(new Error('微信登录失败: ' + err.errMsg));
        }
      });
    });
  },

  // 获取用户信息（需要用户授权）
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        lang: 'zh_CN',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: (err) => {
          // 用户拒绝授权，仍然可以登录，只是没有用户信息
          console.log('用户拒绝授权:', err);
          resolve(null);
        }
      });
    });
  },

  // 调用后端登录接口
  async callLoginAPI(code, userInfo) {
    console.log('=== 调用登录接口 ===');
    console.log('接口URL:', `${app.globalData.baseURL}/user/user/login`);
    console.log('微信code:', code);
    console.log('用户信息:', userInfo);
    
    return new Promise((resolve, reject) => {
      // ⚠️ 重要：根据接口文档，userInfo 应该是字符串
      const requestData = {
        code: code,
        userInfo: userInfo ? JSON.stringify(userInfo) : ''  // 转为字符串
      };
      
      console.log('请求数据:', JSON.stringify(requestData));
      
      wx.request({
        url: `${app.globalData.baseURL}/user/user/login`,
        method: 'POST',
        data: requestData,
        header: {
          'content-type': 'application/json'
        },
        timeout: 10000,
        
        success: (res) => {
          console.log('接口响应:', {
            statusCode: res.statusCode,
            data: res.data
          });
          
          if (res.statusCode === 200) {
            if (res.data.code === 1) {
              console.log('✅ 登录成功，返回数据:', res.data.data);
              resolve(res.data.data);
            } else {
              console.error('❌ 登录失败:', res.data.msg);
              reject(new Error(res.data.msg || '登录失败'));
            }
          } else {
            console.error(`❌ HTTP错误: ${res.statusCode}`);
            reject(new Error(`服务器错误: ${res.statusCode}`));
          }
        },
        
        fail: (err) => {
          console.error('请求失败:', err);
          reject(new Error('网络请求失败: ' + err.errMsg));
        }
      });
    });
  },

  // 保存登录信息
  saveLoginInfo(loginData, userInfo) {
    console.log('保存登录信息:', loginData);
    
    // 保存token
    const token = loginData.token;
    if (token) {
      wx.setStorageSync('token', token);
      app.globalData.token = token;
    } else {
      console.warn('登录返回的token为空');
    }
    
    // 保存用户信息
    const userData = {
      id: loginData.id,
      openid: loginData.openid,
      userName: loginData.userName || '食安卫士用户',
      ...userInfo
    };
    
    wx.setStorageSync('userInfo', userData);
    app.globalData.userInfo = userData;
    app.globalData.isLoggedIn = true;
    
    // 保存用户ID
    if (loginData.id) {
      wx.setStorageSync('userId', loginData.id);
    }
  },

  // 登录成功处理
  loginSuccess() {
    return new Promise((resolve) => {
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500,
        success: () => {
          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            this.navigateToHome();
            resolve();
          }, 1500);
        }
      });
    });
  },

  // 处理登录错误
  handleLoginError(error) {
    console.error('登录错误:', error);
    
    let errorMsg = error.message || '登录失败，请重试';
    
    // 根据错误类型显示不同的提示
    if (errorMsg.includes('网络')) {
      errorMsg = '网络连接失败，请检查网络设置';
    } else if (errorMsg.includes('授权')) {
      errorMsg = '需要您的授权才能登录';
    } else if (errorMsg.includes('token')) {
      errorMsg = '登录凭证无效';
    }
    
    this.setData({ loginError: errorMsg });
    
    wx.showModal({
      title: '登录失败',
      content: errorMsg,
      showCancel: false,
      confirmText: '重新登录',
      confirmColor: '#2ecc71'
    });
  },

  // 跳转到首页
  navigateToHome() {
    // 关闭所有页面，跳转到首页
    wx.switchTab({
      url: '/pages/index/index',
      success: () => {
        console.log('跳转到首页成功');
      },
      fail: (err) => {
        console.error('跳转失败:', err);
        wx.reLaunch({
          url: '/pages/index/index'
        });
      }
    });
  },

  // 游客登录
  loginAsGuest() {
    wx.showModal({
      title: '游客模式',
      content: '游客模式功能受限，部分功能需要登录后才能使用。是否继续？',
      confirmText: '继续体验',
      cancelText: '去登录',
      confirmColor: '#2ecc71',
      success: (res) => {
        if (res.confirm) {
          // 生成游客token
          const guestToken = 'guest_' + Date.now();
          wx.setStorageSync('guestToken', guestToken);
          
          wx.showToast({
            title: '进入游客模式',
            icon: 'success',
            duration: 1500,
            success: () => {
              setTimeout(() => {
                this.navigateToHome();
              }, 1500);
            }
          });
        }
      }
    });
  },

  // 切换协议同意状态
  toggleAgreement(e) {
    console.log('协议状态变更:', e.detail.value);
    console.log('是否勾选：', isAgreed); // 勾选时应输出 true
    // 修正：判断数组是否包含"agree"，转为布尔值
    const isAgreed = e.detail.value.includes('agree');
    this.setData({
      agreed: isAgreed // 此时agreed才是true/false
    });
  },

  // 查看用户协议
  viewAgreement() {
    const content = `
食安卫士用户协议

欢迎使用食安卫士！请仔细阅读以下协议：

1. 服务说明
食安卫士为您提供食品安全信息查询服务，包括但不限于：
- 商品条码扫描查询
- 配料成分分析
- 食品安全风险评估
- 历史记录保存

2. 用户义务
您在使用本服务时，应当：
- 提供真实、准确的个人信息
- 遵守相关法律法规
- 不得利用本服务从事违法活动
- 不得恶意上传虚假信息

3. 免责声明
本应用提供的信息仅供参考，不能替代专业医疗建议。对于因使用本应用信息而导致的任何损失，我们不承担责任。

4. 协议修改
我们保留随时修改本协议的权利，修改后的协议将在应用内公布。
    `;
    
    this.setData({
      showAgreementModal: true,
      modalTitle: '用户协议',
      modalContent: content
    });
  },

  // 查看隐私政策
  viewPrivacy() {
    const content = `
隐私政策

我们高度重视您的隐私保护：

1. 信息收集
我们收集的信息包括：
- 微信OpenID（用于用户识别）
- 扫描历史记录
- 设备基本信息（用于优化体验）
- 用户反馈信息

2. 信息使用
您的信息仅用于：
- 提供核心服务功能
- 优化产品体验
- 服务统计分析
- 遵守法律法规要求

3. 信息安全
我们采取严格措施保护您的信息安全：
- 数据传输加密
- 访问权限控制
- 定期安全检查
- 不存储敏感个人信息

4. 信息共享
我们不会将您的个人信息出售或共享给第三方，除非：
- 获得您的明确同意
- 法律法规要求
- 保护用户或公众安全需要
    `;
    
    this.setData({
      showAgreementModal: true,
      modalTitle: '隐私政策',
      modalContent: content
    });
  },

  // 隐藏协议弹窗
  hideAgreementModal() {
    this.setData({
      showAgreementModal: false
    });
  },

  // 返回按钮处理
  onBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      this.navigateToHome();
    }
  },

  // 页面显示时检查登录状态
  onShow() {
    this.checkLoginStatus();
  }
});