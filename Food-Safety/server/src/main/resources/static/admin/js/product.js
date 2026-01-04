// product.js - 从 product.html 中抽出的脚本，保持原逻辑和行为
$(document).ready(function() {
  // 全局变量
  let currentPage = 1;
  let pageSize = 10;
  let total = 0;
  let searchName = '';
  let searchBarcode = '';
  let selectedIds = [];

  // 检查登录状态
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  // 显示用户名
  $('#userName').text(localStorage.getItem('userName') || '管理员');

  // 退出登录
  $('#logoutBtn').click(function() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userName');
    window.location.href = 'login.html';
  });

  // 加载商品列表
  function loadProducts(page = 1) {
    currentPage = page;

    $.ajax({
      url: 'http://localhost:8080/admin/product/page',
      type: 'GET',
      headers: {
        'token': token
      },
      data: {
        page: page,
        pageSize: pageSize,
        name: searchName,
        barcode: searchBarcode
      },
      success: function(response) {
        if (response.code === 1) {
          renderTable(response.data.records);
          renderPagination(response.data.total);
        } else {
          alert(response.msg);
        }
      },
      error: function() {
        alert('加载失败，请检查网络连接');
      }
    });
  }

  // 渲染表格
  function renderTable(products) {
    const $tbody = $('#productTable');
    $tbody.empty();

    if (products.length === 0) {
      $tbody.html(`
                        <tr>
                            <td colspan="8" class="text-center py-5 text-muted">
                                <i class="bi bi-box2 fs-1 d-block mb-3"></i>
                                暂无商品数据
                            </td>
                        </tr>
                    `);
      return;
    }

    products.forEach(product => {
      const riskClass = product.riskLevel === 0 ? 'risk-safe' : 'risk-danger';
      const riskText = product.riskLevel === 0 ? '安全' : '风险';

      const row = `
                        <tr>
                            <td>${product.id}</td>
                            <td>
                                ${product.image ?
                `<img src="${product.image}" alt="商品图" style="width: 50px; height: 50px; object-fit: cover;">` :
                '<i class="bi bi-image text-muted" style="font-size: 24px;"></i>'}
                            </td>
                            <td>${product.name}</td>
                            <td><code>${product.barcode}</code></td>
                            <td>
                                <div class="text-truncate" style="max-width: 200px;"
                                     title="${product.jsonIngredients}">
                                    ${product.jsonIngredients}
                                </div>
                            </td>
                            <td>
                                <span class="risk-badge ${riskClass}">${riskText}</span>
                                ${product.riskMsg ? `<br><small class="text-danger">${product.riskMsg}</small>` : ''}
                            </td>
                            <td>${new Date(product.createTime).toLocaleString()}</td>
                            <td>
                                <button class="btn btn-sm btn-outline-primary edit-btn"
                                        data-id="${product.id}">
                                    <i class="bi bi-pencil"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-danger delete-btn"
                                        data-id="${product.id}">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </td>
                        </tr>
                    `;
      $tbody.append(row);
    });

    // 绑定编辑按钮事件
    $('.edit-btn').click(function() {
      const productId = $(this).data('id');
      editProduct(productId);
    });

    // 绑定删除按钮事件
    $('.delete-btn').click(function() {
      const productId = $(this).data('id');
      showDeleteModal([productId]);
    });
  }

  // 渲染分页
  function renderPagination(totalCount) {
    total = totalCount;
    const totalPages = Math.ceil(total / pageSize);
    const $pagination = $('#pagination');
    $pagination.empty();

    if (totalPages <= 1) return;

    // 上一页
    const prevDisabled = currentPage === 1 ? 'disabled' : '';
    $pagination.append(`
                    <li class="page-item ${prevDisabled}">
                        <a class="page-link" href="#" data-page="${currentPage - 1}">上一页</a>
                    </li>
                `);

    // 页码
    for (let i = 1; i <= totalPages; i++) {
      const active = i === currentPage ? 'active' : '';
      $pagination.append(`
                        <li class="page-item ${active}">
                            <a class="page-link" href="#" data-page="${i}">${i}</a>
                        </li>
                    `);
    }

    // 下一页
    const nextDisabled = currentPage === totalPages ? 'disabled' : '';
    $pagination.append(`
                    <li class="page-item ${nextDisabled}">
                        <a class="page-link" href="#" data-page="${currentPage + 1}">下一页</a>
                    </li>
                `);

    // 绑定分页点击事件
    $('.page-link').click(function(e) {
      e.preventDefault();
      const page = $(this).data('page');
      if (page && page >= 1 && page <= totalPages) {
        loadProducts(page);
      }
    });
  }

  // 编辑商品
  function editProduct(id) {
    $.ajax({
      url: `http://localhost:8080/admin/product/page?barcode=&name=&page=1&pageSize=1000`,
      type: 'GET',
      headers: { 'token': token },
      success: function(response) {
        if (response.code === 1) {
          const product = response.data.records.find(p => p.id === id);
          if (product) {
            $('#productId').val(product.id);
            $('#barcode').val(product.barcode);
            $('#name').val(product.name);
            $('#jsonIngredients').val(product.jsonIngredients);

            // 编辑时回显阿里云图片
            if (product.image) {
              $('#image').val(product.image);
              $('#imgPreview').html(`<img src="${product.image}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`);
              $('#uploadImgBtn').prop('disabled', false);
            } else {
              resetImgPreview();
            }

            $('#modalTitle').text('编辑商品');
            new bootstrap.Modal(document.getElementById('productModal')).show();
          }
        }
      }
    });
  }

  // 显示删除确认模态框
  function showDeleteModal(ids) {
    selectedIds = ids;
    new bootstrap.Modal(document.getElementById('deleteModal')).show();
  }

  // 搜索
  $('#searchBtn').click(function() {
    searchName = $('#searchName').val();
    searchBarcode = $('#searchBarcode').val();
    loadProducts(1);
  });

  // 重置搜索
  $('#resetBtn').click(function() {
    $('#searchName').val('');
    $('#searchBarcode').val('');
    searchName = '';
    searchBarcode = '';
    loadProducts(1);
  });

  // 新增商品按钮
  $('#productModal').on('show.bs.modal', function(e) {
    if (e.relatedTarget && e.relatedTarget.hasAttribute('data-bs-target')) {
      $('#productForm')[0].reset();
      $('#productId').val('');
      $('#modalTitle').text('新增商品');
      resetImgPreview();
    }
  });

  // 封装上传图片方法
  function uploadImage(callback) {
    const file = $('#fileUpload').prop('files')[0];
    if (!file) {
      callback(true); // 没有图片直接成功
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    $.ajax({
      url: 'http://localhost:8080/admin/common/upload',
      type: 'POST',
      headers: { 'token': token },
      data: formData,
      processData: false,
      contentType: false,
      success: function(res) {
        if (res.code === 1) {
          $('#image').val(res.data); // 回填阿里云地址
          callback(true);
        } else {
          alert('图片上传失败：' + res.msg);
          callback(false);
        }
      },
      error: function() {
        alert('图片上传失败，请检查接口连接！');
        callback(false);
      }
    });
  }

  // 保存商品（新增/编辑）
  $('#productForm').submit(function(e) {
    e.preventDefault();
    const $saveBtn = $(this).find('button[type="submit"]');
    $saveBtn.prop('disabled', true).html('<i class="bi bi-hourglass-split me-1"></i>处理中...');

    // 先自动上传图片
    uploadImage(function(isSuccess) {
      if (!isSuccess) {
        $saveBtn.prop('disabled', false).html('保存');
        return;
      }

      // 再提交商品数据
      const productData = {
        id: $('#productId').val() || null,
        barcode: $('#barcode').val(),
        name: $('#name').val(),
        image: $('#image').val(),
        jsonIngredients: $('#jsonIngredients').val()
      };

      const method = productData.id ? 'PUT' : 'POST';

      $.ajax({
        url: 'http://localhost:8080/admin/product',
        type: method,
        headers: { 'token': token, 'Content-Type': 'application/json' },
        data: JSON.stringify(productData),
        success: function(res) {
          if (res.code === 1) {
            $('#productModal').modal('hide');
            loadProducts(currentPage);
            alert('保存成功');
          } else {
            alert('保存失败：' + res.msg);
          }
        },
        error: function(xhr) {
          alert('保存失败：' + (xhr.responseJSON?.msg || '网络错误'));
        },
        complete: function() {
          $saveBtn.prop('disabled', false).html('保存');
          resetImgPreview();
        }
      });
    });
  });

  // 确认删除
  $('#confirmDeleteBtn').click(function() {
    if (selectedIds.length === 0) {
      alert('请选择要删除的商品');
      return;
    }

    const url = 'http://localhost:8080/admin/product?ids=' + selectedIds.join(',');

    $.ajax({
      url: url,
      type: 'DELETE',
      headers: {
        'token': token
      },
      success: function(response) {
        if (response.code === 1) {
          $('#deleteModal').modal('hide');
          loadProducts(currentPage);
          alert('删除成功');
        } else {
          alert(response.msg);
        }
      },
      error: function() {
        alert('删除失败');
      }
    });
  });

  // 图片上传相关方法
  // 1. 选择本地图片
  $('#chooseFileBtn').click(function() {
    $('#fileUpload').click();
  });

  // 2. 选择图片后预览+启用上传按钮
  $('#fileUpload').change(function(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 图片格式校验
    const allowTypes = ['image/jpg', 'image/jpeg', 'image/png'];
    if (!allowTypes.includes(file.type)) {
      alert('请选择JPG/PNG格式的图片！');
      $(this).val('');
      return;
    }

    // 图片大小校验（5MB）
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB！');
      $(this).val('');
      return;
    }

    // 预览图片
    const reader = new FileReader();
    reader.onload = function(res) {
      $('#imgPreview').html(`<img src="${res.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`);
      $('#uploadImgBtn').prop('disabled', false); // 启用上传按钮
    }
    reader.readAsDataURL(file);
  });

  // 3. 上传图片到阿里云OSS
  $('#uploadImgBtn').click(function() {
    const file = $('#fileUpload').prop('files')[0];
    if (!file) return;

    // 创建FormData对象
    const formData = new FormData();
    formData.append('file', file);

    $(this).prop('disabled', true).html('<i class="bi bi-hourglass-split me-1"></i>上传中...');

    $.ajax({
      url: 'http://localhost:8080/admin/common/upload', // 阿里云上传接口
      type: 'POST',
      headers: { 'token': token }, // 携带登录token
      data: formData,
      processData: false, // 禁止处理数据
      contentType: false, // 禁止设置Content-Type
      success: function(res) {
        if (res.code === 1) {
          // 上传成功：把阿里云图片地址回填到隐藏域
          const ossImgUrl = res.data;
          $('#image').val(ossImgUrl);
          alert('图片上传成功！');
        } else {
          alert('图片上传失败：' + res.msg);
          $('#uploadImgBtn').prop('disabled', false).html('<i class="bi bi-cloud-upload me-1"></i>上传图片');
        }
      },
      error: function() {
        alert('图片上传失败，请检查接口连接！');
        $('#uploadImgBtn').prop('disabled', false).html('<i class="bi bi-cloud-upload me-1"></i>上传图片');
      }
    });
  });

  // 4. 重置图片预览
  function resetImgPreview() {
    $('#imgPreview').html('<i class="bi bi-image text-muted" style="font-size:32px;"></i>');
    $('#image').val('');
    $('#fileUpload').val('');
    $('#uploadImgBtn').prop('disabled', true).html('<i class="bi bi-cloud-upload me-1"></i>上传图片');
  }

  // 初始加载
  loadProducts();
});
