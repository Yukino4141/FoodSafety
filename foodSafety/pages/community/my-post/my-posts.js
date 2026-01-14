// pages/community/my-posts/my-posts.js
const app = getApp();

Page({
  data: {
    // 帖子列表
    posts: [],
    loading: true,
    loadingMore: false,
    hasMore: true,
    empty: false,
    
    // 分页参数
    pageIndex: 1,
    pageSize: 10,
    
    // 用户信息
    userInfo: null,
    isLoggedIn: false,
    
    // 空状态提示
    emptyMessage: '暂无发布内容',
    emptySubMessage: '去发布第一条内容吧',
    
    // 错误状态
    error: false,
    errorMessage: ''
  },

  onLoad() {
    console.log('我的帖子页面加载');
    this.checkAuthStatus();
  },

  onShow() {
    console.log('我的帖子页面显示');
    // 每次显示都刷新数据
    this.loadMyPosts(true);
  },

  onPullDownRefresh() {
    console.log('下拉刷新我的帖子');
    this.loadMyPosts(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    console.log('上拉加载更多');
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadMorePosts();
    }
  },

  // 检查登录状态
  checkAuthStatus() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    
    if (token && userInfo) {
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      });
    } else {
      this.setData({
        isLoggedIn: false,
        userInfo: null
      });
      // 未登录时跳转到登录页
      this.showLoginPrompt();
    }
  },

  // 显示登录提示
  showLoginPrompt() {
    wx.showModal({
      title: '登录提示',
      content: '需要登录才能查看我的帖子',
      confirmText: '去登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          });
        } else {
          // 取消登录则返回上一页
          wx.navigateBack();
        }
      }
    });
  },

  // 加载我的帖子
  async loadMyPosts(isRefresh = false) {
    if (!this.data.isLoggedIn) {
      this.setData({
        loading: false,
        empty: true,
        error: false
      });
      return;
    }

    if (isRefresh) {
      this.setData({ 
        pageIndex: 1, 
        loading: true,
        error: false 
      });
    }
    
    try {
      // 调用获取我的帖子API
      const result = await app.request('/user/community/my-posts', 'GET', {
        page: this.data.pageIndex,
        pageSize: this.data.pageSize
      }, true);
      
      console.log('我的帖子API响应:', result);

      const postRecords = result.records || [];
      
      // 处理帖子数据格式
      const formattedPosts = postRecords.map(post => ({
        id: post.id,
        userId: post.userId,
        title: post.title || '',
        content: post.content || '',
        images: post.images || [],
        likeCount: post.likeCount || 0,
        viewCount: post.viewCount || 0,
        commentCount: post.commentCount || 0,
        isLiked: post.liked || false,
        createTime: post.createTime,
        displayTime: this.formatTime(post.createTime),
        hasImages: post.images && post.images.length > 0,
        userAvatar: '/assets/icons/default-avatar.png',
        userNickname: this.data.userInfo?.nickName || '用户' + post.userId
      }));

      const newPosts = isRefresh ? formattedPosts : [...this.data.posts, ...formattedPosts];
      const total = result.total || 0;
      
      this.setData({
        posts: newPosts,
        loading: false,
        loadingMore: false,
        hasMore: newPosts.length < total,
        empty: newPosts.length === 0,
        error: false
      });
      
      // 更新页面索引
      if (postRecords.length > 0) {
        this.setData({
          pageIndex: this.data.pageIndex + 1
        });
      }
      
      return formattedPosts;
      
    } catch (error) {
      console.error('加载我的帖子失败:', error);
      this.setData({
        loading: false,
        loadingMore: false,
        error: true,
        errorMessage: error.message || '加载失败'
      });
      
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
      
      return [];
    }
  },

  // 加载更多帖子
  async loadMorePosts() {
    if (!this.data.hasMore || this.data.loadingMore || !this.data.isLoggedIn) {
      return;
    }
    
    this.setData({ loadingMore: true });
    await this.loadMyPosts(false);
  },

  // 点赞/取消点赞
  async toggleLike(e) {
    const postId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    if (!this.data.isLoggedIn) {
      this.showLoginPrompt();
      return;
    }
    
    const post = this.data.posts[index];
    if (!post) return;
    
    const isLiked = !post.isLiked;
    const likeCount = post.likeCount + (isLiked ? 1 : -1);
    
    // 先更新UI
    this.setData({
      [`posts[${index}].isLiked`]: isLiked,
      [`posts[${index}].likeCount`]: likeCount
    });
    
    try {
      // 调用点赞API
      await app.request('/user/community/like', 'POST', {
        postId: postId,
        isLike: isLiked
      }, false);
      
      // 点赞成功提示
      if (isLiked) {
        wx.showToast({
          title: '已点赞',
          icon: 'success',
          duration: 1000
        });
      }
      
    } catch (error) {
      console.error('点赞操作失败:', error);
      
      // 如果失败，回滚UI状态
      this.setData({
        [`posts[${index}].isLiked`]: !isLiked,
        [`posts[${index}].likeCount`]: post.likeCount
      });
      
      wx.showToast({
        title: error.message || '操作失败',
        icon: 'none'
      });
    }
  },

  // 跳转到帖子详情页
  navigateToPostDetail(e) {
    const postId = e.currentTarget.dataset.id;
    if (!postId) return;
    
    wx.navigateTo({
      url: `/pages/community/detail/detail?id=${postId}`
    });
  },

  // 编辑帖子
  editPost(e) {
    const postId = e.currentTarget.dataset.id;
    if (!postId) return;
    
    wx.showToast({
      title: '编辑功能开发中',
      icon: 'none'
    });
    // 后续可以跳转到编辑页面
    // wx.navigateTo({
    //   url: `/pages/community/edit/edit?id=${postId}`
    // });
  },

  // 删除帖子
  deletePost(e) {
    const postId = e.currentTarget.dataset.id;
    const index = e.currentTarget.dataset.index;
    
    if (!postId) return;
    
    wx.showModal({
      title: '删除提示',
      content: '确定要删除这条帖子吗？删除后无法恢复',
      confirmText: '删除',
      confirmColor: '#ff4444',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          try {
            // 调用删除帖子API
            await app.request(`/user/community/post/${postId}`, 'DELETE', {}, true);
            
            // 从列表中移除
            const posts = this.data.posts.filter((_, i) => i !== index);
            
            this.setData({
              posts: posts,
              empty: posts.length === 0
            });
            
            wx.showToast({
              title: '删除成功',
              icon: 'success'
            });
            
          } catch (error) {
            console.error('删除帖子失败:', error);
            wx.showToast({
              title: error.message || '删除失败',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  // 发布新内容
  createNewPost() {
    wx.navigateTo({
      url: '/pages/community/create/create'
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
    this.loadMyPosts(true);
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