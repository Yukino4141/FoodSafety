// pages/test/test.js
Page({
  data: {
    barcode: ''
  },

  // 前往详情页
  goToDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/detail/detail?id=${id}`
    });
  },

  // 模拟扫码
  simulateScan() {
    // 模拟扫码结果
    const barcode = '6920000012345';
    wx.navigateTo({
      url: `/pages/detail/detail?barcode=${barcode}`
    });
  },

  // 输入框变化
  onBarcodeInput(e) {
    this.setData({
      barcode: e.detail.value
    });
  },

  // 通过条形码前往
  goByBarcode() {
    const barcode = this.data.barcode.trim();
    if (!barcode) {
      wx.showToast({
        title: '请输入条形码',
        icon: 'none'
      });
      return;
    }
    
    wx.navigateTo({
      url: `/pages/detail/detail?barcode=${barcode}`
    });
  }
});