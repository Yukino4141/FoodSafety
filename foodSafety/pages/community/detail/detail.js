// pages/community/detail/detail.js
const app = getApp();

Page({
  data: {
    // 帖子信息
    post: {},
    postId: '',
    loading: true,
    loadingComments: true,
    loadingMoreComments: false,
    hasMoreComments: true,
    
    // 评论相关
    comments: [],
    commentPage: 1,
    commentContent: '',
    focusCommentInputFlag: false,
    
    // 用户状态
    isLoggedIn: false,
    userInfo: null,
    
    // 错误状态
    error: false,
    errorMessage: ''
  },

  onLoad(options) {
    // 获取跳转传参的帖子ID
    const postId = options.id;
    if (!postId) {
      wx.showToast({
        title: '帖子ID不存在',
        icon: 'none'
      });
      wx.navigateBack();
      return;
    }

    this.setData({ 
      postId,
      loading: true,
      error: false
    });
    
    this.checkAuthStatus();
    this.loadPostDetail();
    this.loadComments();
  },

  onShow() {
    // 页面显示时刷新登录状态
    this.checkAuthStatus();
  },

  onPullDownRefresh() {
    console.log('下拉刷新帖子详情');
    this.loadPostDetail();
    this.loadComments(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 检查登录状态
  checkAuthStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    this.setData({
      isLoggedIn: !!token,
      userInfo: userInfo
    });
  },

  // 加载帖子详情
  async loadPostDetail() {
    try {
      // 使用 app.request 方法，注意路径格式
      const result = await app.request('/user/community/' + this.data.postId, 'GET', {}, true);
      
      console.log('帖子详情API响应:', result);

      // 处理API返回的数据格式
      const formattedPost = {
        id: result.id,
        userId: result.userId,
        title: result.title || '',
        content: result.content || '',
        images: result.images || [],
        likeCount: result.likeCount || 0,
        viewCount: result.viewCount || 0,
        commentCount: result.commentCount || 0,
        isLiked: result.liked || false, // 注意字段名转换
        createTime: result.createTime,
        displayTime: this.formatTime(result.createTime),
        hasImages: result.images && result.images.length > 0
      };
      
      this.setData({
        post: formattedPost,
        loading: false,
        error: false
      });
      
      // 更新页面标题
      if (formattedPost.title) {
        wx.setNavigationBarTitle({
          title: formattedPost.title
        });
      }
      
    } catch (error) {
      console.error('加载帖子详情失败:', error);
      this.setData({ 
        loading: false,
        error: true,
        errorMessage: error.message || '网络连接失败'
      });
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
  },

  // 加载评论列表
  async loadComments(isRefresh = false) {
    if (isRefresh) {
      this.setData({ 
        commentPage: 1,
        loadingMoreComments: false
      });
    } else {
      this.setData({ 
        loadingComments: true 
      });
    }

    try {
      // 使用 app.request 方法
      const result = await app.request('/user/community/comment/list', 'GET', {
        postId: this.data.postId,
        page: this.data.commentPage,
        pageSize: 10
      }, true);

      console.log('评论列表API响应:', result);

      const commentRecords = result.records || [];
      
      // 处理评论数据格式
      const formattedComments = commentRecords.map(comment => ({
        id: comment.id,
        postId: comment.postId,
        userId: comment.userId,
        content: comment.content,
        createTime: comment.createTime,
        displayTime: this.formatTime(comment.createTime),
        userNickname: '用户' + comment.userId, // 根据实际情况获取用户名
        userAvatar: '/assets/icons/default-avatar.png'
      }));

      const newComments = isRefresh 
        ? formattedComments
        : [...this.data.comments, ...formattedComments];

      const total = result.total || 0;
      
      this.setData({
        comments: newComments,
        loadingComments: false,
        loadingMoreComments: false,
        hasMoreComments: newComments.length < total
      });

      // 更新评论页码
      if (commentRecords.length > 0) {
        this.setData({ 
          commentPage: this.data.commentPage + 1 
        });
      }
    } catch (error) {
      console.error('加载评论失败:', error);
      this.setData({
        loadingComments: false,
        loadingMoreComments: false
      });
      
      if (!isRefresh) {
        wx.showToast({
          title: '加载评论失败',
          icon: 'none'
        });
      }
    }
  },

  // 加载更多评论
  loadMoreComments() {
    if (!this.data.hasMoreComments || this.data.loadingMoreComments) return;
    this.setData({ loadingMoreComments: true });
    this.loadComments(false);
  },

  // 点赞/取消点赞
  async toggleLike() {
    if (!this.data.isLoggedIn) {
      this.showLoginPrompt();
      return;
    }

    const { post } = this.data;
    const isLiked = !post.isLiked;
    const likeCount = post.likeCount + (isLiked ? 1 : -1);

    // 先更新UI
    this.setData({
      'post.isLiked': isLiked,
      'post.likeCount': likeCount
    });

    try {
      // 假设存在点赞API，根据实际情况调整
      await app.request('/user/community/like', 'POST', {
        postId: post.id,
        isLike: isLiked
      }, false);
      
      wx.showToast({
        title: isLiked ? '已点赞' : '已取消',
        icon: 'success',
        duration: 1000
      });
    } catch (error) {
      // 失败回滚UI
      this.setData({
        'post.isLiked': !isLiked,
        'post.likeCount': post.likeCount
      });
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index;
    const images = e.currentTarget.dataset.images;
    
    if (!images || images.length === 0) return;
    
    wx.previewImage({
      current: images[index],
      urls: images
    });
  },

  // 复制内容
  copyContent(e) {
    const content = e.currentTarget.dataset.content;
    if (!content) return;
    
    wx.setClipboardData({
      data: content,
      success: () => {
        wx.showToast({
          title: '已复制',
          icon: 'success'
        });
      }
    });
  },

  // 聚焦评论输入框
  focusCommentInput() {
    if (!this.data.isLoggedIn) {
      this.showLoginPrompt();
      return;
    }
    this.setData({ focusCommentInputFlag: true });
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({ commentContent: e.detail.value });
  },

  // 提交评论
  async submitComment() {
    const { postId, commentContent } = this.data;
    
    if (!commentContent.trim()) {
      wx.showToast({
        title: '请输入评论内容',
        icon: 'none'
      });
      return;
    }

    try {
      const result = await app.request('/user/community/comment', 'POST', {
        postId,
        content: commentContent
      }, false);

      console.log('提交评论API响应:', result);

      if (result) { // 根据你提供的接口文档，成功返回评论ID
        wx.showToast({
          title: '评论成功',
          icon: 'success'
        });

        // 清空输入框 + 刷新评论列表
        this.setData({ 
          commentContent: '',
          focusCommentInputFlag: false 
        });
        
        // 重新加载评论列表（从第一页开始）
        this.setData({ commentPage: 1 });
        await this.loadComments(true);

        // 更新帖子评论数
        this.setData({
          'post.commentCount': (this.data.post.commentCount || 0) + 1
        });
      } else {
        throw new Error('评论失败');
      }
    } catch (error) {
      console.error('提交评论失败:', error);
      wx.showToast({
        title: error.message || '评论失败',
        icon: 'none'
      });
    }
  },

  // 显示登录提示
  showLoginPrompt() {
    wx.showModal({
      title: '登录提示',
      content: '需要登录才能进行此操作',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        }
      }
    });
  },

  // 分享触发
  onShareTap() {
    this.onShareAppMessage();
  },

  // 分享配置
  onShareAppMessage() {
    const { post } = this.data;
    return {
      title: post.title || '食安社区优质内容',
      path: `/pages/community/detail/detail?id=${this.data.postId}`,
      imageUrl: post.images && post.images.length > 0 ? post.images[0] : '/assets/images/share-community.jpg'
    };
  },

  // 返回上一页
  goBack() {
    wx.navigateBack();
  },

  // 重新加载
  reloadPage() {
    this.setData({
      loading: true,
      error: false
    });
    this.loadPostDetail();
    this.loadComments(true);
  },

  // 格式化时间
  formatTime(timeString) {
    if (!timeString) return '';
    
    const time = new Date(timeString.replace(/-/g, '/'));
    const now = new Date();
    const diff = now - time;
    
    // 转换为秒
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) {
      return '刚刚';
    } else if (seconds < 3600) {
      return Math.floor(seconds / 60) + '分钟前';
    } else if (seconds < 86400) {
      return Math.floor(seconds / 3600) + '小时前';
    } else if (seconds < 2592000) {
      return Math.floor(seconds / 86400) + '天前';
    } else {
      return time.getFullYear() + '-' + 
             (time.getMonth() + 1).toString().padStart(2, '0') + '-' + 
             time.getDate().toString().padStart(2, '0');
    }
  }
});