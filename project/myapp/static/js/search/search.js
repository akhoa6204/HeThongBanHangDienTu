import {fetchApiSearch} from '../service/search/fetchApi.js';
function processKeyword(keyword){
    const keyword_url = decodeURIComponent(keyword);
    let keyword_final =
    keyword_url.toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d")
                .trim()
                .replace(/\s+/g, '-');
    return keyword_final
}
const main = document.querySelector('main');
let totalPage = 1;
let currentSort = null;
let currentPage = 1;
let keyword_process, keyword;
function processingUrl(currentPage, currentSort){
    const queryParams = new URLSearchParams(window.location.search);
    const category = queryParams.get('category');
    const brand = queryParams.get('brand');
    const minPrice = queryParams.get('min_price');
    const maxPrice = queryParams.get('max_price');
    let url = '';
    if (category) {
        url += `?category=${category.replaceAll('/', '')}`;
    }
    if (brand) {
        if (url.includes('?')) {
            url += `&brand=${brand.replaceAll('/', '')}`;
        } else {
            url += `?brand=${brand.replaceAll('/', '')}`;
        }
    }
    if (!category && !brand) {
        keyword = queryParams.get('keyword').replaceAll('/', '');
        keyword_process = decodeURIComponent(keyword);
        const keyword_final = processKeyword(keyword);
        url += `?keyword=${keyword_final}`;
        console.log(keyword);   
    }
    if (minPrice){
        url += `&min_price=${minPrice.replaceAll('/', '')}`
    }
    if (maxPrice){
        url += `&max_price=${maxPrice.replaceAll('/', '')}`
    }
    url+=`&page=${currentPage}`;
    if (currentSort){
        url += `&sort=${currentSort.replaceAll('/', '')}`
    }
    return url;
}

console.log(processingUrl(currentPage, currentSort));
function loadProducts(options){
    let productContainer = document.querySelector('.productContainer');
    if(!productContainer){
        const productContainerHtml = `<section class="productContainer"></section>`;
        main.innerHTML += productContainerHtml;
        productContainer = document.querySelector('.productContainer');
    }
    const html = `
        ${options.map(option => {
            const discountPrice = option.discount
                ? option.price - option.price * option.discount / 100
                : option.price;
            return `
                <div class="product-item">
                    <div class="header">
                        ${option.discount > 0 ? `<div class="discount">Giảm ${option.discount}%</div>` : ''}
                    </div>
                    <div class="product-image">
                        <a href="/detail/${option.product.category.slug}/${option.product.slug}/${option.slug}/">
                            <img src="${option.img ? option.img[0] : option.product.img[0]}">
                        </a>
                    </div>
                    <div class="name-product">
                        <a href="/detail/${option.product.category.slug}/${option.product.slug}/${option.slug}/">
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
        }).join('')}
    `;
    productContainer.innerHTML = html;
}
function setCurrentPage(value){
    currentPage = value;
}
function getCurrentPage(){
    return currentPage;
}
function loadResultBox(length){
    const resultBox = `
        <section class="resultBox">
            ${length === 0 ?
                `<p>Không tìm thấy sản phẩm cho từ khoá <strong>'${keyword_process}'</strong></p>` :
                `<p>Tìm thấy <strong>${length}</strong> sản phẩm cho từ khoá <strong>'${keyword_process}'</strong></p>`
            }
        </section>
    `;
    main.innerHTML += resultBox;
}
function loadFilterBox(length){
    if (length !== 0) {
        const filterBoxHTML = `
            <section class="filterBox">
                <button class="decreasePriceButton">
                    <i class="fa-solid fa-arrow-down-wide-short"></i>
                    <span>Giá cao</span>
                </button>
                <button class="increasePriceButton">
                    <i class="fa-solid fa-arrow-down-short-wide"></i>
                    <span>Giá thấp</span>
                </button>
            </section>
        `;
        main.innerHTML += filterBoxHTML;
    }

}
function fetchApi(currentPage, sortQuery){
    const dynamicUrl = processingUrl(currentPage, sortQuery)
    return fetchApiSearch(dynamicUrl)
        .then(data => {
            console.log(data);
            totalPage = data.totalPages;
            const result = document.querySelector('.resultBox');
            const filter = document.querySelector('.filterBox');
            if (!result){
                if (keyword){
                    loadResultBox(data.totalProducts);
                }
            }
            if (!filter){
                loadFilterBox(data.totalProducts);
            }
            loadProducts(data.products);
            renderPagination(getCurrentPage(), data.totalPages);
        })
        .catch(error => {
            console.error('Lỗi khi lấy dữ liệu search:', error);
        })
        .finally(()=>{attachEventListener();
        });
}
function createPageButton(page, currentPage) {
    const btn = `
        <p class='${page === currentPage ? "active" : ""}'>${page}</p>
    `;
    return btn;
}
function createDots() {
    const p = '<p>...</p>';
    return p;
}
function renderPagination(currentPage, totalPage){
    let pagination = document.querySelector('#pagination');
    if (!pagination){
        const paginationHtml = `<section id="pagination"></section>`;
        main.innerHTML += paginationHtml;
        pagination = document.querySelector('#pagination');
    }
    pagination.innerHTML = '';
    if (totalPage <= 1) return;
    if (currentPage != 1){
        const chevronLeftHtml = `
            <p class='arrow-btn-left'>
                <i class="fa-solid fa-chevron-left"></i>
            </p>
        `;
        pagination.innerHTML += chevronLeftHtml;
    }

    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPage, currentPage + 1);

    if (currentPage === 1) {
      end = Math.min(3, totalPage);
    }

    if (currentPage === totalPage) {
      start = Math.max(totalPage - 2, 1);
    }

    if (start > 1) {
        pagination.innerHTML += createPageButton(1, currentPage);
      if (start > 2) pagination.innerHTML += createDots();
    }

    for (let i = start; i <= end; i++) {
      pagination.innerHTML += createPageButton(i, currentPage);
    }

    if (end < totalPage) {
      if (end < totalPage - 1) pagination.innerHTML += createDots();
      pagination.innerHTML += createPageButton(totalPage, currentPage);
    }

    if (currentPage != totalPage){
        const chevronRightHtml = `
            <p class='arrow-btn-right'>
                <i class="fa-solid fa-chevron-right"></i>
            </p>
        `;
        pagination.innerHTML += chevronRightHtml;
    };
}
function updateSortButtonUI() {
    const decreasePriceButton = document.querySelector('.decreasePriceButton');
    const increasePriceButton = document.querySelector('.increasePriceButton');
    increasePriceButton.classList.remove('active');
    decreasePriceButton.classList.remove('active');
    if (currentSort === 'increase') {
        increasePriceButton.classList.add('active');
    } else if (currentSort === 'decrease') {
        decreasePriceButton.classList.add('active');
    }
}
function attachEventListener(){
    const filterBox = main.querySelector('.filterBox');
    const pagination = document.getElementById('pagination');
    const decreasePriceButton = filterBox.querySelector('.decreasePriceButton');
    const increasePriceButton = filterBox.querySelector('.increasePriceButton');
    if (filterBox){
        if (!decreasePriceButton.dataset.listenerAttached) {
            decreasePriceButton.addEventListener('click', () => {
                setCurrentPage(1);
                if (currentSort !== 'decrease') {
                    currentSort = 'decrease';
                    fetchApi(getCurrentPage(), currentSort)
                        .then(() => updateSortButtonUI());
                } else {
                    currentSort = null;
                    fetchApi(getCurrentPage(), currentSort)
                        .then(() => updateSortButtonUI());
                }
            });
            decreasePriceButton.dataset.listenerAttached = 'true';
        }
        if (!increasePriceButton.dataset.listenerAttached) {
            increasePriceButton.addEventListener('click', () => {
                console.log('increase');
                setCurrentPage(1);
                if (currentSort !== 'increase') {
                    currentSort = 'increase';
                    fetchApi(getCurrentPage(), currentSort)
                        .then(() => updateSortButtonUI());
                } else {
                    currentSort = null;
                    fetchApi(getCurrentPage(), currentSort)
                        .then(() => updateSortButtonUI());
                }
            });
            increasePriceButton.dataset.listenerAttached = 'true';
        }
    }
    if (pagination){
        const pageAll = pagination.querySelectorAll('p');
        pageAll.forEach((page) => {
            page.addEventListener('click', () =>{
                if (page.textContent === '...') return;
                if (page.classList.contains('arrow-btn-left')){
                    if (currentPage > 1) {
                        setCurrentPage(currentPage- 1);
                    }
                }
                else if (page.classList.contains('arrow-btn-right')){
                    if (currentPage < totalPage) {
                        setCurrentPage(currentPage + 1);
                    }
                }
                else{
                    setCurrentPage(Number(page.textContent));
                }
                fetchApi(getCurrentPage(), currentSort);
            })
        })
    }
}
window.onload = () => {
    fetchApi(currentPage, currentSort);
}
