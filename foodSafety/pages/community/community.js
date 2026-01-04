// pages/community/community.js
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
    
    // 排序方式
    sortBy: 'latest',
    sortOptions: app.globalData.postSortOptions || [],
    
    // 用户信息
    userInfo: null,
    isLoggedIn: false,
    
    // 空状态提示
    emptyMessage: '暂无内容',
    emptySubMessage: '发布第一条内容吧'
  },

  onLoad() {
    console.log('社区页面加载');
    this.checkAuthStatus();
  },

  onShow() {
    console.log('社区页面显示');
    this.loadPosts(true);
  },

  onPullDownRefresh() {
    console.log('下拉刷新社区内容');
    this.loadPosts(true).then(() => {
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
    }
  },

  // 加载帖子列表
  async loadPosts(isRefresh = false) {
    if (isRefresh) {
      this.setData({ pageIndex: 1, loading: true });
    }
    
    const params = {
      page: this.data.pageIndex,
      pageSize: this.data.pageSize,
      sort: this.data.sortBy
    };
    
    try {
      const result = await app.getPostFeed(params);
      
      const newPosts = isRefresh ? result.list : [...this.data.posts, ...result.list];
      
      this.setData({
        posts: newPosts,
        loading: false,
        loadingMore: false,
        hasMore: result.hasMore,
        empty: newPosts.length === 0
      });
      
      // 更新页面索引
      if (!isRefresh && result.list.length > 0) {
        this.setData({
          pageIndex: this.data.pageIndex + 1
        });
      }
      
      return result.list;
      
    } catch (error) {
      console.error('加载帖子失败:', error);
      this.setData({
        loading: false,
        loadingMore: false,
        empty: true,
        error: true,
        errorMsg: error.message || '加载失败'
      });
      
      return [];
    }
  },

  // 加载更多帖子
  async loadMorePosts() {
    if (!this.data.hasMore || this.data.loadingMore) {
      return;
    }
    
    this.setData({ loadingMore: true });
    await this.loadPosts(false);
  },

  // 切换排序方式
  async switchSort(e) {
    const sortBy = e.currentTarget.dataset.sort;
    
    if (this.data.sortBy === sortBy) {
      return; // 已经是当前排序方式
    }
    
    this.setData({
      sortBy: sortBy,
      loading: true
    });
    
    await this.loadPosts(true);
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
      await app.togglePostLike(postId, isLiked);
      
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

  // 发布新内容
  createNewPost() {
    if (!this.data.isLoggedIn) {
      this.showLoginPrompt();
      return;
    }
    
    wx.navigateTo({
      url: '/pages/community/create/create'
    });
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

  // 分享功能
  onShareAppMessage() {
    return {
      title: '食安社区 - 分享食品安全经验',
      path: '/pages/community/community',
      imageUrl: '/assets/images/share-community.jpg'
    };
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
  }
});