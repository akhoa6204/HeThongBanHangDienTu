import { fetchApiProduct, fetchApiReviews, fetchApiAddProductCart, fetchApiSetOrderProduct } from '../service/detail/fetchApi.js';
import { fetchApiAuthenticated } from  '../service/header/header.js';
const listImg = document.querySelector('.viewport .listImg');
let selected_color, selected_version, activeNow = 0, currentQuantity = 1, total = 0, current_version, brand_name,
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
const popupModel = document.querySelector('.popup-model');
const popupContainer = popupModel.querySelector('.popUp-container');
const closePopUpBtn = popupContainer.querySelector('.btnClosePopup');
const all = document.querySelector('main > .reviewBox .filter .all');
const fiveStar = document.querySelector('main > .reviewBox .filter .fiveStar');
const fourStar = document.querySelector('main > .reviewBox .filter .fourStar');
const threeStar = document.querySelector('main > .reviewBox .filter .threeStar');
const twoStar = document.querySelector('main > .reviewBox .filter .twoStar');
const oneStar = document.querySelector('main > .reviewBox .filter .oneStar');
const haveComment = document.querySelector('main > .reviewBox .filter .haveComment');
const haveImg = document.querySelector('main > .reviewBox .filter .haveImg');
const path = window.location.pathname;
const slugCategory = path.split('/')[1];
const slugProduct = path.split('/')[2];
const slugOption = path.split('/')[3];
const slug = {
    'category': slugCategory,
    'product': slugProduct,
    'option': slugOption
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
    if (!current_version){
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
    if (current_version){
        discount = current_version.discount || 0;
        discountedPrice = current_version.price * (1 - discount);
    }else{
        discount = dataCurrentVersions[0].discount || 0;
        discountedPrice = dataCurrentVersions[0].price * (1 - discount)
    }
    html += `
        <p class="afterDiscount">${Number(discountedPrice).toLocaleString('vi-VN')} <u>đ</u></p>
        ${discount > 0 ? `
        <p class="beforeDiscount">
            <small><s>${Number(result.price).toLocaleString('vi-VN')} ₫</s></small>
        </p>` : ''}
    `;
    if (priceBox) {
        priceBox.innerHTML = html;
    }
}
function updateDetail() {
    let memoryData, osCpu, rearCamera, display, quantity;
    if (!current_version){
        memoryData = JSON.parse(dataCurrentVersions[0].memory_and_storage);
        osCpu = JSON.parse(dataCurrentVersions[0].os_and_cpu);
        rearCamera = JSON.parse(dataCurrentVersions[0].rear_camera);
        display = JSON.parse(dataCurrentVersions[0].display);
        quantity = dataCurrentVersions[0].quantity > 0 ? dataCurrentVersions[0].quantity: 'Hết hàng';
    }
    else{
        memoryData = JSON.parse(current_version.memory_and_storage);
        osCpu = JSON.parse(current_version.os_and_cpu);
        rearCamera = JSON.parse(current_version.rear_camera);
        display = JSON.parse(current_version.display);
        quantity = current_version.quantity > 0 ? current_version.quantity : 'Hết hàng';
    }

    detailsBox.innerHTML = `
        <div class="detail"><p>Danh mục</p><p>${category_name}</p></div>
        <div class="detail"><p>Kho</p><p>${quantity}</p></div>
        <div class="detail"><p>Thương hiệu</p><p>${brand_name}</p></div>
        <div class="detail"><p>Dung lượng lưu trữ</p><p>${memoryData["Bộ nhớ trong"]}</p></div>
        <div class="detail"><p>Loại bảo hành</p><p>Bảo hành nhà sản xuất</p></div>
        <div class="detail"><p>Hạn bảo hành</p><p>12 tháng</p></div>
        <div class="detail"><p>Bộ xử lý</p><p>${osCpu["Vi xử lý"]}</p></div>
        <div class="detail"><p>Độ phân giải camera chính</p><p>${rearCamera["Độ phân giải camera"]}</p></div>
        <div class="detail"><p>Kích thước màn hình</p><p>${display["Kích thước màn hình"].replace(/^"|"$/g, "")} inches</p></div>
    `;
}
function updateDescription() {
    let formattedDescription = (current_version ? current_version : dataCurrentVersions[0]).description
        .replace('Hoàng Hà Mobile', '<strong>SmartBuy</strong>')
        .split('\n')
        .map(line => {
            line = line.trim();
            if (!line) return '';

            const startsWith = ['Bảng thông số', 'Đánh giá chi tiết', 'Thông số', 'Tổng quan'];
            const keywords = ['?', 'So sánh', 'Mua', 'SmartBuy'];

            const shouldNotDash = startsWith.some(start => line.startsWith(start)) ||
                                  keywords.some(kw => line.includes(kw));

            return shouldNotDash ? line : `- ${line}`;
        })
        .join('<br>');

    descriptionBox.innerHTML = formattedDescription;
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
    if (current_version){
        current_version.img.forEach(img => {
            html += `<div class="item"><img src="${img}" alt=""></div>`;
        });
    }else{
        html += `<div class="item"><img src="${product.img}" alt=""></div>`;
    }
    if (listImg) listImg.innerHTML = html;
}
function updateUiQuantity(){
    if(current_version){
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
    setCurrentVersion(dataCurrentVersions.find(version => version.color === selected_color));
    setTotal(current_version?.quantity || 1);
    setActiveNow(0);
    listImg.style.transform = `translateX(0%)`;
    updatePrice();
    updateImg();
    updateDetail();
    updateButtonUi();
    updateUiQuantity();
}
function updateColorUI(data) {
    const colorBox = document.querySelector('.productBox .colorBox');
    for (const option of data) {
        const html = `
            <div class="color ${option.color === selected_color ? 'active' : ''} ${option.quantity === 0 ? 'disabled' : ''}"
                 data-color="${option.color}">
                <p>${option.color}</p>
            </div>
        `;
        colorBox.innerHTML += html;
    }
    colorBox.innerHTML += `<p class='error-message'></p>`;
    const colors = colorBox.querySelectorAll('.color');
    for (const color of colors) {
        if (color.classList.contains('disabled')){
            color.disabled=true;
        }else{
            color.addEventListener('click', (e) => {
                if(colorBox.classList.contains('notSelected')) colorBox.classList.remove('notSelected');
                const errorMessage = colorBox.querySelector('.error-message');
                errorMessage.textContent ='';
                updateCurrentColor(e);
            });
        }
    }
}
function updateVersionUI(all_options){
    for (const version of all_options) {
        const isActive = version.slug === slugOption;
        const href = isActive ? '#' : `/${slugCategory}/${slugProduct}/${version.slug}/`;
        const activeClass = isActive ? 'active' : '';

        const html = `
            <a href="${href}" class="category ${activeClass}">
                ${version.version}
            </a>
        `;
        categoryBox.innerHTML += html;
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
            const version = review.option.color;
            const avatar = review.user.img || "https://static.vecteezy.com/system/resources/previews/000/439/863/non_2x/vector-users-icon.jpg"
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
                        <div class='imgBox'><img src="${img.media.trim()}" alt=""></div>
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
            console.log(data);
            // reviews
            updateReviewsUI(data.reviews);
            return data;
        })
        .catch(error => {
            console.error('Lỗi khi lấy dữ liệu reviews:', error);
        });
}
function buyProduct(slugProduct, slugOption) {
    if (!current_version) {
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
    orderList.push({
        slugProduct,
        slugOption,
        color,
        quantity
    });
    fetchApiAuthenticated()
        .then(data => {
            if(data.is_authenticated){
                fetchApiSetOrderProduct(orderList)
                    .then(data => {
                        window.location.href = "/info_order/";
                    })
            }else{
                window.location.href = "/login/";
            }
        });
}
function addProductCart(slugProduct, slugOption){
    if (!current_version) {
        const colorBox = document.querySelector('.productBox .colorBox');
        const errorMessage = colorBox.querySelector('.error-message');
        errorMessage.textContent ='Vui lòng chọn phiên bản';
        if(!colorBox.classList.contains('notSelected')){
            colorBox.classList.add('notSelected');
        }
        return;
    };
    const color = document.querySelector('.productBox .colorBox .color.active').textContent.trim();
    console.log(color);
    const quantity = document.querySelector('.productBox .quantityBox .quantity p:nth-child(2)').textContent;
    const product = {
        slugProduct,
        slugOption,
        color,
        quantity
    };
    fetchApiAuthenticated()
        .then(data => {
            if (data.is_authenticated){
                fetchApiAddProductCart(product)
                    .then(data => {
                        if (data){
                            if (data.detail === 'Sản phẩm đã tồn tại trong giỏ hàng.'){
                                alert(data.detail);
                                return;
                            }
                            popupModel.classList.add('active')
                        }
                    })
                }
            else{
                window.location.href ='/login/';
            }
        })
}
window.onload = () => {
    fetchApiProduct(slug)
        .then(data => {
            if (data) {
                product = data.product;
                dataCurrentVersions = data.current_options;
                console.log(dataCurrentVersions);
                brand_name = data.brand.name;
                category_name = data.category.name;
                h3.textContent = data.product.name;
                updateImg();
                updateColorUI(data.current_options);
                updateVersionUI(data.all_options);
                updatePrice();
                updateUiQuantity();
                updateDetail();
                updateDescription();

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
                    addProductCart(slugProduct, slugOption);
                })
                buyButton.addEventListener('click', ()=>{
                    buyProduct(slugProduct, slugOption);
                })
                setInterval(()=>{
                    activeNow + 1 < listImg.children.length ? setActiveNow(activeNow + 1): setActiveNow(0);
                    listImg.style.transform = `translateX(-${activeNow * 100}%)`;
                    }, 3000);
            }
        })
        .catch(error => {
                console.error('Lỗi khi lấy dữ liệu product:', error);
        });
    fetchApiReview(slugProduct, 1, 0)
        .then(data => {
            // add Review Average
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

