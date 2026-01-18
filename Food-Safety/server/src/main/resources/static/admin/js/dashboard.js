// dashboard.js - 获取 /admin/dashboard 并渲染到页面
$(document).ready(function() {
  // 检查登录状态
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  $('#userName').text(localStorage.getItem('userName') || '管理员');
  $('#logoutBtn').click(function() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
  });

  function loadDashboard() {
    $.ajax({
      url: '/admin/dashboard',
      type: 'GET',
      headers: { 'token': token },
      success: function(res) {
        if (res.code === 1) {
          const d = res.data;
          $('#totalUsers').text(d.totalUsers ?? '--');
          $('#todayScans').text(d.todayScans ?? '--');
        } else {
          alert(res.msg || '获取仪表盘数据失败');
        }
      },
      error: function() {
        alert('请求失败，请检查网络或登录状态');
      }
    });
  }

  loadDashboard();
});