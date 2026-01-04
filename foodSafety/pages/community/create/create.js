// pages/community/create/create.js
const app = getApp();

Page({
  data: {
    // 表单数据
    formData: {
      title: '',
      content: '',
      images: []
    },
    
    // 发布状态
    submitting: false,
    
    // 字数限制
    titleMaxLength: 50,
    contentMaxLength: 1000,
    
    // 当前字数
    titleLength: 0,
    contentLength: 0
  },

  onLoad(options) {
    console.log('发布页面加载');
  },

  // 标题输入
  onTitleInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.title': value,
      titleLength: value.length
    });
  },

  // 内容输入
  onContentInput(e) {
    const value = e.detail.value;
    this.setData({
      'formData.content': value,
      contentLength: value.length
    });
  },

  // 选择图片
  chooseImages() {
    if (this.data.formData.images.length >= 9) {
      wx.showToast({
        title: '最多只能选择9张图片',
        icon: 'none'
      });
      return;
    }
    
    const maxCount = 9 - this.data.formData.images.length;
    
    wx.chooseMedia({
      count: maxCount,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        console.log('选择图片成功:', res.tempFiles);
        
        const tempFiles = res.tempFiles;
        const newImages = tempFiles.map(file => file.tempFilePath);
        
        // 直接使用临时路径（后端需要支持base64或上传）
        // 注意：实际项目中应该上传到服务器
        this.setData({
          'formData.images': [...this.data.formData.images, ...newImages]
        });
      },
      fail: (err) => {
        console.error('选择图片失败:', err);
        wx.showToast({
          title: '选择图片失败',
          icon: 'none'
        });
      }
    });
  },

  // 删除图片
  removeImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = [...this.data.formData.images];
    images.splice(index, 1);
    
    this.setData({
      'formData.images': images
    });
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = this.data.formData.images;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  // 发布帖子
  async submitPost() {
    const { formData } = this.data;
    
    // 验证内容
    if (!formData.content.trim()) {
      wx.showToast({
        title: '请输入内容',
        icon: 'none'
      });
      return;
    }
    
    // 验证内容长度
    if (formData.content.length > this.data.contentMaxLength) {
      wx.showToast({
        title: `内容不能超过${this.data.contentMaxLength}字`,
        icon: 'none'
      });
      return;
    }
    
    this.setData({ submitting: true });
    
    try {
      const postData = {
        content: formData.content
      };
      
      // 如果有标题
      if (formData.title.trim()) {
        postData.title = formData.title;
      }
      
      // 如果有图片（注意：这里需要上传到服务器）
      // 由于没有图片上传接口，暂时不传图片
      // 实际项目中需要先上传图片到OSS
      // if (formData.images.length > 0) {
      //   const uploadedUrls = await this.uploadImages(formData.images);
      //   postData.images = uploadedUrls;
      // }
      
      console.log('发布帖子数据:', postData);
      
      // 调用发布接口
      const result = await app.createPost(postData);
      
      // 显示成功提示
      wx.showToast({
        title: '发布成功',
        icon: 'success',
        duration: 1000
      });
      
      // 返回社区页面
      setTimeout(() => {
        wx.switchTab({
          url: '/pages/community/community'
        });
      }, 1500);
      
    } catch (error) {
      console.error('发布失败:', error);
      this.setData({ submitting: false });
      
      wx.showToast({
        title: error.message || '发布失败',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 返回
  goBack() {
    wx.navigateBack();
  }
});