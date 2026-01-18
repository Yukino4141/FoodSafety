// pages/inventory/inventory.js
const app = getApp();

Page({
  data: {
    // 库存列表
    inventoryList: [],
    filteredList: [], // 新增：筛选后的列表
    loading: true,
    empty: true,
    error: false,
    errorMsg: '',
    currentDataField: '',
    
    // 筛选状态
    filterStatus: null, // null:全部, 1:新鲜, 2:临期, 3:过期, 4:已消耗
    filterOptions: [
      { id: null, name: '全部', count: 0 },
      { id: 1, name: '新鲜', count: 0 },
      { id: 2, name: '临期', count: 0 },
      { id: 3, name: '过期', count: 0 },
      { id: 4, name: '已消耗', count: 0 }
    ],
    
    // 统计信息
    stats: {
      total: 0,
      fresh: 0,
      expiring: 0,
      expired: 0,
      consumed: 0, // 已消耗
      expiringSoon: 0 // 3天内过期
    },
    
    // 编辑相关
    editingItem: null,
    showEditModal: false,
    editLoading: false,
    
    // 表单数据
    editForm: {
      expiryDate: '',
      purchaseDate: ''
    },
    
    // 删除相关
    deletingId: null,
    showDeleteConfirm: false,
    deleteConfirmMessage: '',
    
    // 空状态提示
    emptyMessage: '冰箱空空如也',
    emptySubMessage: '扫描商品后可以添加到冰箱',
    
    // 批量操作
    batchProcessing: false,
    
    // 消耗相关
    consumingItem: null,
    showConsumeConfirm: false,
    consumeConfirmMessage: ''
  },

  onShow() {
    console.log('库存页面显示');
    this.loadInventoryData();
  },

  onPullDownRefresh() {
    console.log('下拉刷新库存数据');
    this.loadInventoryData(true).then(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载库存数据
  async loadInventoryData(forceRefresh = false) {
    this.setData({ loading: true, error: false, errorMsg: '' });
    
    try {
      // 1. 检查登录状态
      if (!app.globalData.isLoggedIn) {
        throw new Error('请先登录');
      }
      
      // 2. 获取全部库存数据（不进行筛选）
      const inventoryList = await app.getInventoryList();
      
      console.log('获取库存列表成功:', inventoryList.length);
      
      // 3. 处理数据：尊重数据库中的状态，不要重新计算
      const processedList = this.processInventoryList(inventoryList);
      
      // 4. 计算统计信息
      const stats = this.calculateStats(processedList);
      
      // 5. 更新筛选选项计数
      const filterOptions = this.updateFilterCounts(this.data.filterOptions, processedList);
      
      // 6. 根据当前筛选状态过滤列表
      const filteredList = this.filterInventoryList(processedList, this.data.filterStatus);
      
      // 7. 更新页面数据
      this.setData({
        inventoryList: processedList,
        filteredList: filteredList,
        stats: stats,
        filterOptions: filterOptions,
        loading: false,
        empty: filteredList.length === 0,
        emptyMessage: this.getEmptyMessage(this.data.filterStatus),
        emptySubMessage: this.getEmptySubMessage(this.data.filterStatus)
      });
      
    } catch (error) {
      console.error('加载库存数据失败:', error);
      
      this.setData({
        loading: false,
        empty: true,
        error: true,
        errorMsg: error.message || '加载失败'
      });
      
      // 如果是未登录错误，提示用户登录
      if (error.message.includes('登录')) {
        wx.showModal({
          title: '登录提示',
          content: '需要登录才能查看冰箱库存',
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
      } else {
        wx.showToast({
          title: error.message || '加载失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    }
  },

  // 处理库存列表：尊重数据库状态，不重新计算
  processInventoryList(inventoryList) {
    return inventoryList.map(item => {
      // 如果状态已经是已消耗（4），保持原状态
      if (item.status === 4) {
        return {
          ...item,
          // 确保其他字段也存在
          statusText: this.getStatusText(4),
          statusColor: this.getStatusColor(4)
        };
      }
      
      // 如果不是已消耗状态，根据过期日期计算状态
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let expiryDate = null;
      if (item.expiryDate) {
        expiryDate = new Date(item.expiryDate);
        expiryDate.setHours(0, 0, 0, 0);
      }
      
      let remainingDays = 0;
      let calculatedStatus = item.status || 1; // 默认新鲜
      
      if (expiryDate) {
        const diffTime = expiryDate.getTime() - today.getTime();
        remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // 根据剩余天数计算状态
        if (remainingDays < 0) {
          calculatedStatus = 3; // 过期
        } else if (remainingDays <= 3) {
          calculatedStatus = 2; // 临期
        } else {
          calculatedStatus = 1; // 新鲜
        }
      }
      
      return {
        ...item,
        status: calculatedStatus,
        remainingDays: remainingDays,
        statusText: this.getStatusText(calculatedStatus),
        statusColor: this.getStatusColor(calculatedStatus)
      };
    });
  },

  // 计算统计信息 - 修复版本
  calculateStats(inventoryList) {
    const stats = {
      total: 0,
      fresh: 0,
      expiring: 0,
      expired: 0,
      consumed: 0,
      expiringSoon: 0
    };
    
    inventoryList.forEach(item => {
      if (item.status === 1) {
        stats.fresh++;
      } else if (item.status === 2) {
        stats.expiring++;
      } else if (item.status === 3) {
        stats.expired++;
      } else if (item.status === 4) {
        stats.consumed++;
      }
      
      // 3天内过期（包括今天），只计算非已消耗商品
      if (item.status !== 4 && item.remainingDays >= 0 && item.remainingDays <= 3) {
        stats.expiringSoon++;
      }
    });
    
    // 总数不包括已消耗的商品
    stats.total = stats.fresh + stats.expiring + stats.expired;
    
    return stats;
  },

  // 更新筛选选项计数 - 修复版本
  updateFilterCounts(filterOptions, inventoryList) {
    const counts = {
      null: 0, // 全部：不包括已消耗
      1: 0,    // 新鲜
      2: 0,    // 临期
      3: 0,    // 过期
      4: 0     // 已消耗
    };
    
    inventoryList.forEach(item => {
      const status = item.status;
      if (status !== 4) {
        counts.null++; // 非已消耗商品计入"全部"
      }
      
      if (counts[status] !== undefined) {
        counts[status]++;
      }
    });
    
    return filterOptions.map(option => ({
      ...option,
      count: counts[option.id] || 0
    }));
  },

  // 过滤库存列表 - 修复版本
  filterInventoryList(list, status) {
    if (status === null) {
      // 全部状态：显示除已消耗外的所有商品
      return list.filter(item => item.status !== 4);
    } else if (status === 4) {
      // 已消耗状态：只显示已消耗的商品
      return list.filter(item => item.status === 4);
    } else {
      // 其他状态：显示对应状态且非已消耗的商品
      return list.filter(item => item.status === status && item.status !== 4);
    }
  },

  // 获取空状态消息 - 修复版本
  getEmptyMessage(filterStatus) {
    const messages = {
      null: '冰箱空空如也', // 全部（不包括已消耗）
      1: '暂无新鲜商品',
      2: '暂无临期商品',
      3: '暂无过期商品',
      4: '暂无已消耗商品'
    };
    return messages[filterStatus] || messages.null;
  },

  // 获取空状态副消息 - 修复版本
  getEmptySubMessage(filterStatus) {
    const messages = {
      null: '扫描商品后可以添加到冰箱',
      1: '所有商品都需要关注保质期哦',
      2: '很好！没有需要紧急处理的商品',
      3: '很棒！冰箱里没有过期食品',
      4: '还没有标记为已消耗的商品'
    };
    return messages[filterStatus] || messages.null;
  },

  // 切换筛选状态 - 修复版本
  async switchFilter(e) {
    const status = e.currentTarget.dataset.status;
    
    if (this.data.filterStatus === status) {
      return; // 已经是当前状态
    }
    
    this.setData({
      filterStatus: status,
      loading: true
    });
    
    try {
      // 获取全部库存数据
      const inventoryList = this.data.inventoryList;
      
      // 根据筛选状态过滤列表
      const filteredList = this.filterInventoryList(inventoryList, status);
      
      this.setData({
        filteredList: filteredList,
        loading: false,
        empty: filteredList.length === 0,
        emptyMessage: this.getEmptyMessage(status),
        emptySubMessage: this.getEmptySubMessage(status)
      });
      
    } catch (error) {
      console.error('筛选加载失败:', error);
      this.setData({ loading: false });
      wx.showToast({
        title: '筛选失败，请重试',
        icon: 'none'
      });
    }
  },

  // 查看商品详情
  viewProductDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (item && item.productId) {
      wx.navigateTo({
        url: `/pages/detail/detail?id=${item.productId}`
      });
    }
  },

  // 编辑库存商品
  editInventoryItem(e) {
    const item = e.currentTarget.dataset.item;
    
    // 只有非已消耗状态的商品才能编辑
    if (item.status === 4) {
      wx.showToast({
        title: '已消耗的商品不能编辑',
        icon: 'none'
      });
      return;
    }
    
    // 设置编辑表单数据
    const today = new Date();
    const defaultDate = today.toISOString().split('T')[0];
    const defaultExpiryDate = new Date(today);
    defaultExpiryDate.setDate(today.getDate() + 7); // 默认一周后过期
    const defaultExpiryDateStr = defaultExpiryDate.toISOString().split('T')[0];
    
    this.setData({
      editingItem: item,
      showEditModal: true,
      editForm: {
        expiryDate: item.expiryDate || defaultExpiryDateStr,
        purchaseDate: item.purchaseDate || defaultDate
      }
    });
  },

  // 表单输入处理
  onEditInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [`editForm.${field}`]: value
    });
  },

  // 保存编辑
  async saveEdit() {
    const { editingItem, editForm } = this.data;
    
    if (!editingItem) {
      return;
    }
    
    // 验证数据
    if (!editForm.expiryDate) {
      wx.showToast({
        title: '请填写过期日期',
        icon: 'none'
      });
      return;
    }
    
    this.setData({ editLoading: true });
    
    try {
      const updateData = {
        expiryDate: editForm.expiryDate,
        purchaseDate: editForm.purchaseDate || null
      };
      
      // 调用 app.js 中的更新接口（PUT /user/inventory/{id}）
      const result = await app.updateInventoryItem(editingItem.id, updateData);
      
      if (result === 'success') {
        // 关闭弹窗
        this.closeEditModal();
        
        // 重新加载数据
        await this.loadInventoryData();
        
        wx.showToast({
          title: '更新成功',
          icon: 'success'
        });
      } else {
        throw new Error(result.msg || '更新失败');
      }
      
    } catch (error) {
      console.error('更新库存商品失败:', error);
      wx.showToast({
        title: error.message || '更新失败',
        icon: 'none'
      });
    } finally {
      this.setData({ editLoading: false });
    }
  },

  // 删除库存商品
  confirmDelete(e) {
    const itemId = e.currentTarget.dataset.id;
    const itemName = e.currentTarget.dataset.name || '该商品';
    
    this.setData({
      deletingId: itemId,
      showDeleteConfirm: true,
      deleteConfirmMessage: `确定要从冰箱移除"${itemName}"吗？`
    });
  },

  // 执行删除
  async executeDelete() {
    const itemId = this.data.deletingId;
    
    if (!itemId) {
      this.closeDeleteConfirm();
      return;
    }
    
    wx.showLoading({ title: '删除中...' });
    
    try {
      // 调用 app.js 中的删除接口（DELETE /user/inventory/{id}）
      const result = await app.deleteInventoryItem(itemId);
      
      if (result === 'success') {
        // 重新加载数据
        await this.loadInventoryData();
        
        wx.showToast({
          title: '已移除',
          icon: 'success'
        });
      } else {
        throw new Error(result.msg || '删除失败');
      }
      
    } catch (error) {
      console.error('删除库存商品失败:', error);
      wx.showToast({
        title: error.message || '删除失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.closeDeleteConfirm();
    }
  },

  // 关闭删除确认
  closeDeleteConfirm() {
    this.setData({
      deletingId: null,
      showDeleteConfirm: false,
      deleteConfirmMessage: ''
    });
  },

  // 标记商品为已消耗
  confirmConsume(e) {
    const itemId = e.currentTarget.dataset.id;
    const itemName = e.currentTarget.dataset.name || '该商品';
    
    this.setData({
      consumingItem: itemId,
      showConsumeConfirm: true,
      consumeConfirmMessage: `确定要将"${itemName}"标记为已消耗吗？`
    });
  },

  // 执行消耗 - 修复版本
  async executeConsume() {
    const itemId = this.data.consumingItem;
    
    if (!itemId) {
      this.closeConsumeConfirm();
      return;
    }
    
    wx.showLoading({ title: '标记中...' });
    
    try {
      // 调用 app.js 中的消耗接口（PATCH /user/inventory/{id}/consume）
      // 添加请求体，明确指定要更新状态
      const result = await app.request(`/user/inventory/${itemId}/consume`, 'PATCH', {
        status: 4
      });
      
      console.log('消耗接口返回:', result);
      
      if (result === 'success' || result.code === 1) {
        // 立即更新本地数据状态，避免重新加载时被重新计算
        const updatedList = this.data.inventoryList.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              status: 4, // 强制设置为已消耗
              statusText: this.getStatusText(4),
              statusColor: this.getStatusColor(4)
            };
          }
          return item;
        });
        
        // 重新计算统计信息
        const stats = this.calculateStats(updatedList);
        const filterOptions = this.updateFilterCounts(this.data.filterOptions, updatedList);
        const filteredList = this.filterInventoryList(updatedList, this.data.filterStatus);
        
        this.setData({
          inventoryList: updatedList,
          filteredList: filteredList,
          stats: stats,
          filterOptions: filterOptions,
          empty: filteredList.length === 0
        });
        
        wx.showToast({
          title: '已标记为消耗',
          icon: 'success'
        });
      } else {
        throw new Error(result.msg || '标记失败');
      }
      
    } catch (error) {
      console.error('标记消耗失败:', error);
      wx.showToast({
        title: error.message || '标记失败',
        icon: 'none'
      });
    } finally {
      wx.hideLoading();
      this.closeConsumeConfirm();
    }
  },

  // 关闭消耗确认
  closeConsumeConfirm() {
    this.setData({
      consumingItem: null,
      showConsumeConfirm: false,
      consumeConfirmMessage: ''
    });
  },

  // 批量操作（批量删除过期商品）
  batchDeleteExpired() {
    const expiredItems = this.data.inventoryList.filter(item => item.status === 3);
    
    if (expiredItems.length === 0) {
      wx.showToast({
        title: '没有过期商品',
        icon: 'none'
      });
      return;
    }
    
    wx.showModal({
      title: '批量移除',
      content: `确定要移除${expiredItems.length}个过期商品吗？`,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '处理中...' });
          
          try {
            // 批量删除过期商品
            const deletePromises = expiredItems.map(item => 
              app.deleteInventoryItem(item.id)
            );
            
            const results = await Promise.all(deletePromises);
            
            // 检查是否所有操作都成功
            const allSuccess = results.every(result => result.code === 1 || result === 'success');
            
            if (allSuccess) {
              // 重新加载数据
              await this.loadInventoryData();
              
              wx.showToast({
                title: `已移除${expiredItems.length}个商品`,
                icon: 'success'
              });
            } else {
              throw new Error('部分删除操作失败');
            }
            
          } catch (error) {
            console.error('批量删除失败:', error);
            wx.showToast({
              title: error.message || '删除失败，请重试',
              icon: 'none'
            });
          } finally {
            wx.hideLoading();
          }
        }
      }
    });
  },

  // 添加新商品到冰箱（跳转到扫码）
  addNewItem() {
    wx.navigateTo({
      url: '/pages/index/index'
    });
  },

  // 快速扫描添加
  quickScanAdd() {
    // 检查登录状态
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '登录提示',
        content: '需要登录才能添加商品到冰箱',
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
      return;
    }
    
    wx.scanCode({
      onlyFromCamera: true,
      scanType: ['barCode'],
      success: (res) => {
        console.log('快速扫描结果:', res);
        // 跳转到详情页，详情页会有添加到冰箱的按钮
        wx.navigateTo({
          url: `/pages/detail/detail?barcode=${res.result}`
        });
      },
      fail: (err) => {
        console.error('扫描失败:', err);
        if (err.errMsg.includes('auth')) {
          wx.showModal({
            title: '权限提示',
            content: '需要使用摄像头权限',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '扫码失败',
            icon: 'none'
          });
        }
      }
    });
  },

  // 刷新按钮点击
  onRefresh() {
    this.loadInventoryData(true);
  },

  // 查看商品保质期建议
  viewExpirySuggestions() {
    wx.showModal({
      title: '保质期管理建议',
      content: '• 新鲜食品尽量3天内食用\n• 临期食品（3天内过期）优先食用\n• 过期食品及时清理\n• 定期检查冰箱库存',
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 分享功能
  onShareAppMessage() {
    const { stats } = this.data;
    const title = stats.expiringSoon > 0 ? 
      `我的冰箱里有${stats.expiringSoon}个商品快过期了！` : 
      '我的冰箱管理 - 食安卫士';
    
    return {
      title: title,
      path: '/pages/inventory/inventory',
      imageUrl: '/assets/images/share-inventory.jpg'
    };
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { stats } = this.data;
    return {
      title: `我的冰箱有${stats.total}个商品，${stats.expiringSoon}个快过期了！`,
      query: ''
    };
  },

  // 处理网络错误重试
  onRetryLoad() {
    this.loadInventoryData();
  },

  // 显示商品详情弹窗
  showItemDetail(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    
    wx.showModal({
      title: item.productName || '商品详情',
      content: `过期日期：${item.expiryDate || '未设置'}\n剩余天数：${item.remainingDays || 0}天\n状态：${item.statusText || '未知'}`,
      showCancel: false,
      confirmText: '知道了'
    });
  },

  // 显示日期选择器
  showDatePicker(e) {
    const field = e.currentTarget.dataset.field;
    const currentValue = this.data.editForm[field] || '';
    const title = field === 'expiryDate' ? '选择过期日期' : '选择购买日期';
    
    this.setData({
      datePickerVisible: true,
      currentDataField: field,
      datePickerTitle: title,
      datePickerValue: currentValue
    });
  },

  // 日期选择器变化
  onDatePickerChange(e) {
    const value = e.detail.value;
    this.setData({
      datePickerValue: value
    });
  },

  // 确认日期选择
  confirmDatePicker() {
    const { currentDataField, datePickerValue } = this.data;
    
    if (currentDataField && datePickerValue) {
      this.setData({
        [`editForm.${currentDataField}`]: datePickerValue
      });
    }
    
    this.closeDatePicker();
  },

  // 关闭日期选择器
  closeDatePicker() {
    this.setData({
      datePickerVisible: false,
      currentDataField: '',
      datePickerTitle: '选择日期',
      datePickerValue: ''
    });
  },

  // 快速设置日期（今天、明天、一周后等）
  quickSetDate(e) {
    const type = e.currentTarget.dataset.type;
    const field = this.data.currentDataField;
    
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 计算天数差（优化版）
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
  
  // 清除日期
  clearDate(e) {
    const field = e.currentTarget.dataset.field;
    if (field) {
      this.setData({
        [`editForm.${field}`]: ''
      });
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
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      1: '新鲜',
      2: '临期',
      3: '过期',
      4: '已消耗'
    };
    return statusMap[status] || '未知';
  },

  // 获取状态颜色
  getStatusColor(status) {
    const colorMap = {
      1: '#07c160', // 绿色
      2: '#ff9500', // 橙色
      3: '#ff3b30', // 红色
      4: '#8e8e93'  // 灰色
    };
    return colorMap[status] || '#cccccc';
  },

  // 根据状态判断是否显示操作按钮
  showActionButtons(status) {
    // 已消耗的商品不显示编辑和消耗按钮
    return status !== 4;
  }
});