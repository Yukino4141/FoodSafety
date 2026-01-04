// login.js - 从 login.html 中抽出的脚本
$(document).ready(function() {
    // 检查是否已登录
    const token = localStorage.getItem('adminToken');
    if (token) {
        window.location.href = 'product.html';
    }

    $('#loginForm').submit(function(e) {
        e.preventDefault();

        const username = $('#username').val();
        const password = $('#password').val();

        // 简单的客户端验证
        if (!username || !password) {
            showError('用户名和密码不能为空');
            return;
        }

        // 发送登录请求
        $.ajax({
            url: 'http://localhost:8080/admin/employee/login',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                username: username,
                password: password
            }),
            success: function(response) {
                if (response.code === 1) {
                    // 保存token到localStorage
                    localStorage.setItem('adminToken', response.data.token);
                    localStorage.setItem('userName', response.data.name);
                    // 跳转到商品管理页面
                    window.location.href = 'product.html';
                } else {
                    showError(response.msg);
                }
            },
            error: function(xhr) {
                showError('登录失败，请检查网络连接');
            }
        });
    });

    function showError(message) {
        $('#errorAlert').text(message).show();
        setTimeout(function() {
            $('#errorAlert').hide();
        }, 3000);
    }
});
