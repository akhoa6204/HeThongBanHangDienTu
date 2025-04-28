import {fetchApiSearch} from '../service/search/fetchApi.js';
function processKeyword(keyword){
    let keyword_final = keyword.toLowerCase();
    keyword_final = keyword_final
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim()
        .replace(/\s+/g, '-');
    return keyword_final
}
const path = window.location.pathname;
const slug = path.split('/')[2];
let currentPage = 1;
const keyword = processKeyword(slug).replaceAll('%20', '-');
const keyword_process = slug.replaceAll('%20', ' ');
const resultBox = document.querySelector('.resultBox');
const productContainer = document.querySelector('.productContainer');
const pagination = document.querySelector('.paginationBox');
const productBox = productContainer.querySelector('.productBox');
function loadProducts(options){
    let html = '';

    for (const option of options) {
        const discountPrice = option.discount
                ? option.price - option.price * option.discount / 100
                : option.price;

        html += `
            <div class="product-item">
                <div class="header">
                    ${option.discount > 0 ? `<div class="discount">Giảm ${option.discount}%</div>` : ''}
                </div>
                <div class="product-image">
                    <a href="/${option.product.category.slug}/${option.product.slug}/${option.slug}/">
                        <img src="${option.img ? option.img[0] : option.product.img[0]}">
                    </a>
                </div>
                <div class="name-product">
                    <a href="/${option.product.category.slug}/${option.product.slug}/${option.slug}/">
                        <p>${option.product.name} - ${option.version} - ${option.color}</p>
                    </a>
                </div>
                <div class="price">
                    <span style="color: red; font-weight: 600;">
                        ${Number(discountPrice).toLocaleString('vi-VN')}đ
                    </span>
                    ${option.discount ? `<span style="color: gray; text-decoration: line-through;">
                        ${Number(option.price).toLocaleString('vi-VN')}đ
                    </span>` : ''}
                </div>
            </div>
        `;
    }
    productBox.innerHTML = html;
//    productContainer.innerHTML = html;
}
function setCurrentPage(value){
    currentPage = value;
}
function getCurrentPage(){
    return currentPage;
}
function loadResultBox(length){
    if (length === 0){
        const html = `<p>Không tìm thấy sản phẩm cho từ khoá <strong>'${keyword_process}'</strong></p>`;
        resultBox.innerHTML = html;
    }else{
        const html = `<p>Tìm thấy <strong>${length}</strong> sản phẩm cho từ khoá <strong>'${keyword_process}'</strong></p>`
        resultBox.innerHTML = html;
    }
}
function fetchApi(keyword, currentPage){
    return fetchApiSearch(keyword, currentPage)
        .then(data => {
            loadProducts(data.products);
            return data;
            // Uncomment để debug nếu cần
            // for (const option of data) {
            //     console.log(option.product);
            // }
        })
        .catch(error => {
            console.error('Lỗi khi lấy dữ liệu search:', error);
        });
}
window.onload = () => {
    fetchApi(keyword, currentPage)
        .then(data =>{
            loadResultBox(data.totalProducts)
            renderPagination(getCurrentPage(), data.totalPages);
            console.log(data);
        })
}
function createPageButton(page, currentPage) {
    const btn = document.createElement('p');
    btn.innerText = page;
    if (page === currentPage) {
      btn.className = 'active';
    }else{
        btn.onclick = () => {
          setCurrentPage(page);
          fetchApi(keyword, getCurrentPage())
            .then(data => renderPagination(getCurrentPage(), data.totalPages))
        };
    }
    return btn;
}
function createDots() {
    const p = document.createElement('p');
    p.innerText = '...';
    return p;
}
function renderPagination(currentPage, totalPage){
    const pagination = document.querySelector('#pagination');
    pagination.innerHTML = '';
    if (totalPage <= 1) return;
    if (currentPage != 1){
        // Tạo nút mũi tên trái
        const chevronLeft = document.createElement('p');
        chevronLeft.className = 'arrow-btn';
        chevronLeft.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        chevronLeft.onclick = () => {
          if (currentPage > 1) {
            setCurrentPage(currentPage- 1);
            fetchApi(keyword, getCurrentPage())
                .then(data => renderPagination(getCurrentPage(), data.totalPages))
          }
        };
        pagination.appendChild(chevronLeft);
    }

    // Page numbers logic
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPage, currentPage + 1);

    if (currentPage === 1) {
      end = Math.min(3, totalPage);
    }

    if (currentPage === totalPage) {
      start = Math.max(totalPage - 2, 1);
    }

    if (start > 1) {
        pagination.appendChild(createPageButton(1, currentPage));
      if (start > 2) pagination.appendChild(createDots());
    }

    for (let i = start; i <= end; i++) {
      pagination.appendChild(createPageButton(i, currentPage));
    }

    if (end < totalPage) {
      if (end < totalPage - 1) pagination.appendChild(createDots());
      pagination.appendChild(createPageButton(totalPage, currentPage));
    }

    if (currentPage != totalPage){
        const chevronRight = document.createElement('p');
        chevronRight.className = 'arrow-btn';
        chevronRight.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        chevronRight.disabled = currentPage === totalPage;
        chevronRight.onclick = () => {
          if (currentPage < totalPage) {
            setCurrentPage(currentPage + 1);
            fetchApi(keyword, getCurrentPage())
                .then(data => renderPagination(getCurrentPage(), data.totalPages))
          }
        };
        pagination.appendChild(chevronRight);
    }
}
