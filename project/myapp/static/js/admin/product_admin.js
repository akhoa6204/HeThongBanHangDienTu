import { fetchApiGetProducts, fetchApiDeleteProduct, fetchApiRestoreProduct } from '../service/product_admin/fetchApi.js';

const tableBody = document.getElementById('product-table-body');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');

function renderProducts(products) {
  const tbody = document.getElementById('product-table-body');
  tbody.innerHTML = '';

  if (products.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Không có sản phẩm</td></tr>';
    return;
  }

  products.forEach(product => {
    const imgSrc = product.images.length > 0 ? product.images[0].img : '';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${product.id}</td>
      <td>${product.name}</td>
      <td><img src="${imgSrc}" alt="${product.name}" style="max-width: 60px; max-height: 60px; object-fit: contain;"></td>
      <td>${product.quantity || 0}</td>
      <td class="status-cell">${product.status ? (product.quantity > 0 ? 'Còn hàng' : 'Hết hàng') : 'Đã xóa'}</td>
      <td>${product.category?.name || ''}</td>
      <td class="action-cell">
        <a href="/quantri/products/detail/${product.id}/" class="btn-edit">Chi tiết</a>
        ${product.status
          ? `<button class="btn-delete">Xóa</button>`
          : `<button class="btn-restore">Khôi phục</button>`}
      </td>
    `;
    tbody.appendChild(row);

    const statusCell = row.querySelector('.status-cell');
    const actionCell = row.querySelector('.action-cell');

    const deleteBtn = row.querySelector('.btn-delete');
    const restoreBtn = row.querySelector('.btn-restore');

    if (deleteBtn) addDeleteHandler(deleteBtn, product, statusCell, actionCell);
    if (restoreBtn) addRestoreHandler(restoreBtn, product, statusCell, actionCell);
  });
}


function renderPagination(totalPage, currentPage) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  if (totalPage <= 1) return;

  // Nút mũi tên trái
  if (currentPage > 1) {
    const chevronLeft = document.createElement('p');
    chevronLeft.className = 'arrow-btn';
    chevronLeft.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    chevronLeft.onclick = () => {
      const newPage = currentPage - 1;
      fetchProduct(newPage);
    };
    pagination.appendChild(chevronLeft);
  }

  // Tính start và end trang hiển thị
  let start = Math.max(1, currentPage - 1);
  let end = Math.min(totalPage, currentPage + 1);

  if (currentPage === 1) {
    end = Math.min(3, totalPage);
  }
  if (currentPage === totalPage) {
    start = Math.max(totalPage - 2, 1);
  }

  // Nút đầu tiên luôn hiện
  if (start > 1) {
    pagination.appendChild(createPageButton(1, currentPage));
    if (start > 2) pagination.appendChild(createDots());
  }

  // Các nút trang giữa
  for (let i = start; i <= end; i++) {
    pagination.appendChild(createPageButton(i, currentPage));
  }

  // Nút cuối cùng luôn hiện
  if (end < totalPage) {
    if (end < totalPage - 1) pagination.appendChild(createDots());
    pagination.appendChild(createPageButton(totalPage, currentPage));
  }

  // Nút mũi tên phải
  if (currentPage < totalPage) {
    const chevronRight = document.createElement('p');
    chevronRight.className = 'arrow-btn';
    chevronRight.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    chevronRight.onclick = () => {
      const newPage = currentPage + 1;
      fetchProduct(newPage);
    };
    pagination.appendChild(chevronRight);
  }
}

function createPageButton(page, currentPage) {
  const btn = document.createElement('p');
  btn.innerText = page;
  if (page === currentPage) {
    btn.className = 'active';
  } else {
    btn.onclick = () => {
      fetchProduct(page);
    };
  }
  return btn;
}

function createDots() {
  const p = document.createElement('p');
  p.innerText = '...';
  p.className = 'dots';
  return p;
}

function fetchProduct(page = 1, search = '') {
  fetchApiGetProducts(page, search)
    .then(data => {
      console.log(data);
      renderProducts(data.products);
      renderPagination(data.total_pages, data.current_page);
    })
    .catch(err => {
      console.error('Error fetching products:', err);
    });
}

searchInput.addEventListener('keydown', function(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    const keyword = searchInput.value.trim();
    fetchProduct(1, keyword);
  }
});

searchInput.addEventListener('input', function(event) {
  const keyword = searchInput.value.trim();
  if (keyword === '') {
    fetchProduct(1);
  }
});

fetchProduct(1, '');
function addDeleteHandler(button, product, statusCell, actionCell) {
  button.addEventListener('click', () => {
    const popup = document.querySelector('.popup-model.error.product');
    popup.classList.add('active');

    const acceptBtn = popup.querySelector('.accept');
    const newAccept = acceptBtn.cloneNode(true);
    acceptBtn.replaceWith(newAccept);

    newAccept.addEventListener('click', () => {
      popup.classList.remove('active');

      fetchApiDeleteProduct(product.id)
        .then(() => {
          product.status = false;
          statusCell.textContent = 'Đã xóa';
          button.remove();

          const restoreBtn = document.createElement('button');
          restoreBtn.className = 'btn-restore';
          restoreBtn.textContent = 'Khôi phục';
          actionCell.appendChild(restoreBtn);

          addRestoreHandler(restoreBtn, product, statusCell, actionCell);

          const successPopup = document.querySelector('.popup-model.success.delete_product');
          successPopup.classList.add('active');
        })
        .catch(() => {
          const errorPopup = document.querySelector('.popup-model.error.delete_product');
          errorPopup.classList.add('active');
        });
    });
  });
}

function addRestoreHandler(button, product, statusCell, actionCell) {
  button.addEventListener('click', () => {
    fetchApiRestoreProduct(product.id)
      .then(() => {
        const popupRestoreSuccess = document.querySelector(".success.restore_product");
        popupRestoreSuccess.classList.add('active');
        product.status = true;
        statusCell.textContent = product.quantity > 0 ? 'Còn hàng' : 'Hết hàng';
        button.remove();

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.textContent = 'Xóa';
        actionCell.appendChild(deleteBtn);

        addDeleteHandler(deleteBtn, product, statusCell, actionCell);
      })
      .catch(() => {
        const popupRestoreError = document.querySelector(".error.restore_product");
        popupRestoreError.classList.add('active');
      });
  });
}
