import { fetchApiProduct, fetchApiReviews, fetchApiAddProductCart, fetchApiSetOrderProduct } from '../service/detail/fetchApi.js';
import { fetchApiAuthenticated, fetchApiTotalProduct } from  '../service/header/header.js'

const listImg = document.querySelector('.viewport .listImg');
let selected_color, activeNow = 0, currentQuantity = 1, total = 0, current_version, brand_name,
    category_name, avgReview = 0, totalPage =1 , currentPage= 1, dataCurrentVersions, product;
const h3 = document.querySelector(".productBox .detail .name");
const prevButton = document.querySelector(".buttonBox .prev");
const nextButton = document.querySelector(".buttonBox .next");
const priceBox = document.querySelector('.detail .priceBox');
const quantityBox = document.querySelector('.detail .quantityBox .quantity');
const prevQuantity = quantityBox.querySelector('p:first-child');
const numberQuantity = quantityBox.querySelector('p:nth-child(2)');
const nextQuantity = quantityBox.querySelector('p:last-child');
const detailsBox = document.querySelector('.detailsBox .main');
const descriptionBox = document.querySelector('.descriptionBox p');
const categoryBox = document.querySelector('.productBox .categoryBox');
const cartButton = document.querySelector('.detail .buttonBox button:first-child');
const buyButton = document.querySelector('.detail .buttonBox button:last-child');
const popupModelSuccess = document.querySelector('.popup-model.success');
const popupModelWarning = document.querySelector('.popup-model.warning');

const all = document.querySelector('main > .reviewBox .filter .all');
const fiveStar = document.querySelector('main > .reviewBox .filter .fiveStar');
const fourStar = document.querySelector('main > .reviewBox .filter .fourStar');
const threeStar = document.querySelector('main > .reviewBox .filter .threeStar');
const twoStar = document.querySelector('main > .reviewBox .filter .twoStar');
const oneStar = document.querySelector('main > .reviewBox .filter .oneStar');
const haveComment = document.querySelector('main > .reviewBox .filter .haveComment');
const haveImg = document.querySelector('main > .reviewBox .filter .haveImg');
const path = window.location.pathname;
const slugCategory = path.split('/')[2];
const slugProduct = path.split('/')[3];
const slug = {
    'category': slugCategory,
    'product': slugProduct,
}

function setSelectedColor(color) {
    selected_color = color;
}
function getCurrentVersion(){
    return current_version;
}
function setCurrentVersion(version){
    current_version = version;
}
function setCurrentQuantity(quantity) {
    currentQuantity = quantity;
}
function setActiveNow(val) {
    activeNow = val;
}
function setTotal(val){
    total = val;
}
function updateButtonUi(){
    if (!selected_color){
        buyButton.disabled = true;
        cartButton.disabled = true;
    }else{
        buyButton.disabled = false;
        cartButton.disabled = false;
    }
}
function updatePrice() {
    let html = '';
    let discount ='';
    let discountedPrice ='';
    let price = '';
    if (selected_color){
        price = current_version.colors.find(color => color.color === selected_color).price;
        discount = Number(current_version.discount) || 0;
        discountedPrice = price * (1 - discount);
    }else{
        price = product.options[0].colors[0].price;
        discount = product.options[0].discount || 0;
        discountedPrice = price * (1 - discount);
    }
    html += `
        <p class="afterDiscount">${Number(discountedPrice).toLocaleString('vi-VN')} <u>đ</u></p>
        ${discount > 0 ? `
        <p class="beforeDiscount">
            <small><s>${Number(price).toLocaleString('vi-VN')} ₫</s></small>
        </p>` : ''}
    `;
    if (priceBox) {
        priceBox.innerHTML = html;
    }
}
function updateDetail() {
    let html = '';
    let quantity;
    if (!selected_color){
        quantity = product.options[0].colors[0].stock > 0 ? product.options[0].colors[0].stock : 'Hết hàng';
        html += `
            <div class="detail"><p>Danh mục</p><p>${category_name}</p></div>
            <div class="detail"><p>Kho</p><p>${quantity}</p></div>
            <div class="detail"><p>Thương hiệu</p><p>${brand_name}</p></div>
        `;
        product.options[0].details.forEach(detail => {
            html += `<div class="detail"><p>${detail.name}</p><p>${detail.value}</p></div>`
        })
        detailsBox.innerHTML = html;
    }
    else{
        quantity = current_version.colors.find(color => color.color === selected_color).stock > 0 ? current_version.colors.find(color => color.color === selected_color).stock : 'Hết hàng';
        html += `
            <div class="detail"><p>Danh mục</p><p>${category_name}</p></div>
            <div class="detail"><p>Kho</p><p>${quantity}</p></div>
            <div class="detail"><p>Thương hiệu</p><p>${brand_name}</p></div>
        `;
        current_version.details.forEach(detail => {
            html += `<div class="detail"><p>${detail.name}</p><p>${detail.value}</p></div>`
        })
        detailsBox.innerHTML = html;
    }
    detailsBox.innerHTML = html;

}
function updateReviewsForStar() {
    reviewBox.innerHTML = `
        <h3>ĐÁNH GIÁ SẢN PHẨM</h3>
        <div class="menu">
            <div class="rating"></div>
            <div class="filter">
                <button onclick="updateReviewsForStar()">Tất cả</button>
                <button onclick="updateReviewsForStar(5)">5 sao</button>
                <button onclick="updateReviewsForStar(4)">4 sao</button>
                <button onclick="updateReviewsForStar(3)">3 sao</button>
                <button onclick="updateReviewsForStar(2)">2 sao</button>
                <button onclick="updateReviewsForStar(1)">1 sao</button>
                <button class="twoColumn">Có bình luận</button>
                <button class="twoColumn">Có hình Ảnh/ Video</button>
            </div>
        </div>
    `;
}
function updateImg() {
    let html = "";

    if (selected_color){
        const images = current_version.colors.find(color => color.color === selected_color).images;
        console.log(images)
        images.forEach(img => {
            html += `<div class="item"><img src="${img.img}" alt=""></div>`;
        });
    }else{
        html += `<div class="item"><img src="${product.images[0].img}" alt=""></div>`;
    }
    if (listImg) listImg.innerHTML = html;
}
function updateUiQuantity(){
    if(selected_color){
        quantityBox.disabled = false;
        if(quantityBox.classList.contains('disabled')){
            quantityBox.classList.remove('disabled');
        }
    }
    else{
        quantityBox.disabled = true;
        if(!quantityBox.classList.contains('disabled')){
            quantityBox.classList.add('disabled');
        }
    }
    setCurrentQuantity(1);
    numberQuantity.textContent = currentQuantity;
}
function updateCurrentColor(e){
    setSelectedColor(e.currentTarget.getAttribute('data-color'));
    document.querySelectorAll('.color').forEach(color => {
        if (color.getAttribute('data-color') === selected_color){
            if(!color.classList.contains('active')){
                color.classList.add('active')
            }
        }else{
            color.classList.remove('active')
        }
    });
    const stock = current_version.colors.find(color => color.color === selected_color).stock;
    setTotal(stock || 1);
    setActiveNow(0);
    listImg.style.transform = `translateX(0%)`;
    updatePrice();
    updateImg();
    updateDetail();
    updateButtonUi();
    updateUiQuantity();
}
function updateColorUI(options) {
    const colorBox = document.querySelector('.productBox .colorBox');
    colorBox.innerHTML = '<p>Màu sắc</p>';
    let isLoad = false;
    for (const option of options) {
        if(current_version && option.slug !== current_version.slug) continue;
        if (isLoad) break;
        for (const color of option.colors){
            const html = `
                <div class="color ${color.color === selected_color ? 'active' : ''} ${color.stock === 0 ? 'disabled' : ''}"
                     data-color="${color.color}">
                    <p>${color.color}</p>
                </div>
            `;
            colorBox.innerHTML += html;
            isLoad = true;
        }
    }
    colorBox.innerHTML += `<p class='error-message'></p>`;
    const colors = colorBox.querySelectorAll('.color');
    for (const color of colors) {
        if (color.classList.contains('disabled')){
            color.disabled=true;
        }else{
            color.addEventListener('click', (e) => {
                if (!current_version){
                    const errorMessage = colorBox.querySelector('.error-message');
                    errorMessage.textContent ='Vui lòng chọn phiên bản';
                    colorBox.classList.add('notSelected')
                    return;
                }
                if(colorBox.classList.contains('notSelected')) colorBox.classList.remove('notSelected');
                const errorMessage = colorBox.querySelector('.error-message');
                errorMessage.textContent ='';
                updateCurrentColor(e);
            });
        }
    }
}
function updateVersionUI(options) {
    categoryBox.innerHTML = '<p>Phiên bản</p>';
    for (const version of options) {
        const isActive = current_version && version.slug === current_version.slug;
        const activeClass = isActive ? 'active' : '';

        const button = document.createElement('button');
        button.className = `category ${activeClass}`;
        button.innerHTML += `<p>${version.version}</p>`;
        button.style.background = 'none';

        button.addEventListener('click', () => {
            if (current_version === version) return;
            const colorBox = document.querySelector('.productBox .colorBox');
            if (colorBox.classList.contains('notSelected')) colorBox.classList.remove('notSelected');
            const errorMessage = colorBox.querySelector('.error-message');
            errorMessage.textContent = '';

            setCurrentVersion(version);
            selected_color = null;

            updateDetail();
            updateDescription('');
            updateVersionUI(options);
            updateColorUI(options);
        });

        categoryBox.appendChild(button);
    }
}
function updateReviewsUI(reviews){
    const reviewBox = document.querySelector('main > .reviewBox');
    const reviewItemContainer = reviewBox.querySelector('.reviewItemContainer');
    reviewItemContainer.innerHTML = '';
    if (reviews.length > 0){
        for( const review of reviews){
            const name = review.user.first_name + " " + review.user.last_name;
            const content = review.content;
            const star_count = review.star_count;
            const version = review.product.options[0].colors[0].color;
            const avatar = "https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg"
            const created_at = review.created_at;
            const quality = review.quality;
            const summary = review.summary;
            const featureHighlight = review.featureHighlight;
            const reviewReply = review.reviewReply;
            let dateOnly;
            try{
                dateOnly = created_at.split("T")[0];
            }catch{
                dateOnly = null;
            }
            const imgList = review.media;
            const imagesHTML = imgList && imgList.length > 0
            ? `
                <div class="imgReviewBox">
                    ${imgList.map(img => `
                        <div class='imgBox'><img src="${img.img}" alt=""></div>
                    `
                    ).join('')}
                </div>
            `
            : '';
            let star = '';
            for (let i = 0; i < 5; i++){
                if(i < star_count){
                    star += '<i class="fa-solid fa-star star active"></i>';
                }else{
                    star += '<i class="fa-solid fa-star star"></i>';
                }
            };
            const reviewHTML = `
                <div class="reviewItem">
                    <div class="imgBox">
                            <img src=${avatar} alt="">
                    </div>
                    <div class="content">
                        <p class="name"><strong>${name}</strong></p>
                        <div class="starBox">
                            ${star}
                        </div>
                        <div class="dateAndCategory">
                            <p class="date">${dateOnly}</p>
                            <p class="category">Phân loại hàng: ${version}</p>
                        </div>
                        <div class="summaryBox">
                            ${ quality ?
                                `<div class="quality">
                                    <p>Chất lượng sản phẩm:</p>
                                    <p>${quality}</p>
                                </div>` :
                                ''
                            }
                            ${summary ?
                                `<div class="description">
                                    <p>Đúng với mô tả:</p>
                                    <p>${summary}</p>
                                </div>`:
                                ''
                            }
                            ${featureHighlight ?
                                `<div class="quality">
                                    <p>Tính năng nổi bật:</p>
                                    <p>${featureHighlight}</p>
                                </div>` :
                                ''
                            }
                        </div>
                        ${content ? `<p class="mainContent">${content}</p>`: ''}

                        ${imagesHTML}

                        ${reviewReply ?
                            `<div class ='reviewReply'>
                                <h3>Phản hồi của người bán</h3>
                                <p>${reviewReply.content}</p>
                            </div>` :
                            ''
                        }
                    </div>
                </div>
            `;
            reviewItemContainer.innerHTML += reviewHTML;
        };
    }
    else{
        const div = document.createElement('div');
        div.className = 'none';
        const img = document.createElement('img');
        img.setAttribute('src', 'https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/shoprating/3215f6ba1a0e877fa06e.png');
        const p = document.createElement('p');
        p.textContent='Chưa có đánh giá về sản phẩm';
        div.appendChild(img);
        div.appendChild(p);
        reviewItemContainer.appendChild(div);
    }
}
function updateAvgReviewUI(avg, total){
    const reviewBox = document.querySelector('main > .reviewBox');
    const reviewProductBox = document.querySelector(".productBox .detail .reviewBox");

    const ratingReview = reviewBox.querySelector('.rating');
    const ratingDetail = reviewProductBox.querySelector('.rating');

    const rating_html_review = `<p><strong>${avg}</strong> trên 5</p>`;
    const rating_html_detail = `<p><u>${avg}</u></p>`;
    const totalReview = `<p><u style="color: black">${total}</u> Đánh giá</p>`;

    ratingDetail.innerHTML = rating_html_detail;
    ratingReview.innerHTML = rating_html_review;

    const html_starBox = `
        <div class="starBox">
            ${
                (() => {
                    let stars = '';
                    for (let i = 0; i < 5; i++) {
                        if (i < Math.round(avg)) {
                            stars += '<i class="fa-solid fa-star star active"></i>';
                        } else {
                            stars += '<i class="fa-solid fa-star star"></i>';
                        }
                    }
                    return stars;
                })()
            }
        </div>
    `;
    ratingDetail.innerHTML += html_starBox;
    ratingReview.innerHTML += html_starBox;
    reviewProductBox.querySelector('.comment').innerHTML = totalReview;
}
function renderPagination(totalPage, currentPage, star) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = '';
    if (totalPage <= 1) return;
    if (currentPage != 1){
        // Tạo nút mũi tên trái
        const chevronLeft = document.createElement('p');
        chevronLeft.className = 'arrow-btn';
        chevronLeft.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        chevronLeft.disabled = currentPage === 1;
        chevronLeft.onclick = () => {
          if (currentPage > 1) {
            currentPage--;
            fetchApiReview(slugProduct, currentPage, star)
              .then(data => renderPagination(data.total_pages, currentPage, star));
          }
        };
        pagination.appendChild(chevronLeft);
    }

    // Page numbers logic
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPage, currentPage + 1);

    // Giới hạn hiển thị 3 số
    if (currentPage === 1) {
      end = Math.min(3, totalPage);
    }

    if (currentPage === totalPage) {
      start = Math.max(totalPage - 2, 1);
    }


    if (start > 1) {
      pagination.appendChild(createPageButton(1, currentPage, star));
      if (start > 2) pagination.appendChild(createDots());
    }

    for (let i = start; i <= end; i++) {
      pagination.appendChild(createPageButton(i, currentPage, star));
    }

    if (end < totalPage) {
      if (end < totalPage - 1) pagination.appendChild(createDots());
      pagination.appendChild(createPageButton(totalPage, currentPage, star));
    }
    if (currentPage != totalPage){
        const chevronRight = document.createElement('p');
        chevronRight.className = 'arrow-btn';
        chevronRight.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        chevronRight.disabled = currentPage === totalPage;
        chevronRight.onclick = () => {
          if (currentPage < totalPage) {
            currentPage++;
            fetchApiReview(slugProduct, currentPage, star)
              .then(data => renderPagination(data.total_pages, currentPage, star));
          }
        };
        pagination.appendChild(chevronRight);
    }
  }
function createPageButton(page, currentPage, star) {
    const btn = document.createElement('p');
    btn.innerText = page;
    if (page === currentPage) {
      btn.className = 'active';
    }else{
        btn.onclick = () => {
          currentPage = page;
          fetchApiReview(slugProduct, currentPage, star)
            .then(data => renderPagination(data.total_pages, currentPage, star));
        };
    }
    return btn;
}
function createDots() {
    const p = document.createElement('p');
    p.innerText = '...';
    return p;
}
function fetchApiReview(slugProduct, pageNumber, star){
    return fetchApiReviews(slugProduct, pageNumber, star)
        .then(data => {
            // reviews
            updateReviewsUI(data.reviews);
            return data;
        })
        .catch(error => {
            console.error('Lỗi khi lấy dữ liệu reviews:', error);
        });
}
function buyProduct(slugProduct) {
    if (!selected_color) {
        const colorBox = document.querySelector('.productBox .colorBox');
        const errorMessage = colorBox.querySelector('.error-message');
        errorMessage.textContent ='Vui lòng chọn phiên bản';
        if(!colorBox.classList.contains('notSelected')){
            colorBox.classList.add('notSelected');
        }
        return;
    };
    const color = document.querySelector('.productBox .colorBox .color.active').textContent.trim();
    const quantity = document.querySelector('.productBox .quantityBox .quantity p:nth-child(2)').textContent;
    let orderList = [];
    const slugOption = current_version.slug;
    orderList.push({
        slugProduct,
        slugOption,
        color,
        quantity
    });
    fetchApiAuthenticated()
    .then(data => {
        fetchApiSetOrderProduct(orderList)
            .then(data => {
                window.location.href = "/info_order/";
            })
            .catch(err => {
                alert("Lỗi ở setorder");
            })

    })
    .catch(err => window.location.href = "/login/")
}
function addProductCart(slugProduct){
    if (!selected_color) {
        const colorBox = document.querySelector('.productBox .colorBox');
        const errorMessage = colorBox.querySelector('.error-message');
        errorMessage.textContent ='Vui lòng chọn phiên bản';
        if(!colorBox.classList.contains('notSelected')){
            colorBox.classList.add('notSelected');
        }
        return;
    };
    const color = document.querySelector('.productBox .colorBox .color.active').textContent.trim();
    const quantity = document.querySelector('.productBox .quantityBox .quantity p:nth-child(2)').textContent;
    const slugOption = current_version.slug;
    const product = {
        slugProduct,
        slugOption,
        color,
        quantity
    };
    fetchApiAuthenticated()
    .then(data => {
       fetchApiAddProductCart(product)
        .then(data => {
            fetchApiTotalProduct()
            .then(data => {
                const total = data.total_product || 0;
                const totalProduct= document.querySelector('.total-product');
                totalProduct && totalProduct.classList.add('active');
                totalProduct.innerHTML = total;
            })
            popupModelSuccess.classList.add('active')
        })
        .catch(error => {
            popupModelWarning.classList.add('active')
        })

    })
   .catch(error => window.location.href ='/login/')
}
function updateDescription(product=''){
    if(!current_version){
        descriptionBox.innerHTML = product.options[0].description;
    }else{
        descriptionBox.innerHTML = current_version.description || '';
    }
}
window.onload = () => {
    fetchApiProduct(slug)
        .then(data => {
            if (data) {
                product = data.product;
                console.log("product: ");
                console.log(product);
                brand_name = product.brand.name;
                category_name = product.category.name;
                h3.textContent = product.name;
                updateDescription(product)

                updateImg();
                updateColorUI(product.options);
                updateVersionUI(product.options);
                updatePrice();
                updateUiQuantity();
                updateDetail();

                nextButton.addEventListener("click", () =>{
                    activeNow + 1 < listImg.children.length ? setActiveNow(activeNow + 1): setActiveNow(0);
                    listImg.style.transform = `translateX(-${activeNow * 100}%)`;
                });
                prevButton.addEventListener("click", ()=>{
                    activeNow > 0 ? setActiveNow(activeNow - 1) : setActiveNow(listImg.children.length -1);
                    listImg.style.transform = `translateX(-${activeNow * 100}%)`;
                });
                prevQuantity.addEventListener("click", () => {
                    currentQuantity - 1 > 0  ? setCurrentQuantity(currentQuantity - 1)  : setCurrentQuantity(1);
                    numberQuantity.textContent = currentQuantity;
                });
                nextQuantity.addEventListener("click", () => {
                    currentQuantity = (currentQuantity + 1 <= total) ? currentQuantity + 1 : currentQuantity;
                    numberQuantity.textContent = currentQuantity;
                });
                cartButton.addEventListener('click', ()=>{
                    addProductCart(slugProduct);
                })
                buyButton.addEventListener('click', ()=>{
                    buyProduct(slugProduct);
                })
                setInterval(()=>{
                    activeNow + 1 < listImg.children.length ? setActiveNow(activeNow + 1): setActiveNow(0);
                    listImg.style.transform = `translateX(-${activeNow * 100}%)`;
                    }, 3000);
            }
        })
        .catch(error => {
            alert(error.message);
            window.location.href= '/';
        });
    fetchApiReview(slugProduct, 1, 0)
        .then(data => {
            updateAvgReviewUI(data.avg, data.total_reviews);

            currentPage = data.page;
            totalPage = data.total_pages;
            renderPagination(totalPage, currentPage, 0);
        });
    all.addEventListener('click', ()=>{
        fetchApiReview(slugProduct, 1, 0)
            .then(data => {
                currentPage = data.page;
                totalPage = data.total_pages;
                renderPagination(totalPage, currentPage, 0);
            });
    });
    fiveStar.addEventListener('click', () =>{
        fetchApiReview(slugProduct, 1, 5)
            .then(data => {
                currentPage = data.page;
                totalPage = data.total_pages;
                renderPagination(totalPage, currentPage, 5);
            });
    });
    fourStar.addEventListener('click', () =>{
        fetchApiReview(slugProduct, 1, 4)
            .then(data => {
                currentPage = data.page;
                totalPage = data.total_pages;
                renderPagination(totalPage, currentPage, 4);
            });
    });
    threeStar.addEventListener('click', () =>{
        fetchApiReview(slugProduct, 1, 3)
            .then(data => {
                currentPage = data.page;
                totalPage = data.total_pages;
                renderPagination(totalPage, currentPage, 3);
            });
    });
    twoStar.addEventListener('click', () =>{
        fetchApiReview(slugProduct, 1, 2)
            .then(data => {
                currentPage = data.page;
                totalPage = data.total_pages;
                renderPagination(totalPage, currentPage, 2);
            });
    });
    oneStar.addEventListener('click', () =>{
        fetchApiReview(slugProduct, 1, 1)
            .then(data => {
                currentPage = data.page;
                totalPage = data.total_pages;
                renderPagination(totalPage, currentPage, 1);
            });
    });
    haveComment.addEventListener('click', () =>{
        fetchApiReview(slugProduct, 1, 7)
            .then(data => {
                if (data.total_pages > 0){
                    totalPage = data.total_pages;
                    currentPage = data.page;
                    renderPagination(totalPage, currentPage, 7);
                }
            });
    });
    haveImg.addEventListener('click', () =>{
        fetchApiReview(slugProduct, 1, 6)
            .then(data => {
                console.log(data);
                currentPage = data.page;
                totalPage = data.total_pages;
                renderPagination(totalPage, currentPage, 6);
            });
    });
};

