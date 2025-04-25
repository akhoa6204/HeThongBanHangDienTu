import { fetchApiProduct, fetchApiReviews, fetchApiAddProductCart } from '../service/detail/fetchApi.js';
import {
    updatePrice,
    updateDetail,
    updateDescription,
    updateReviewsForStar,
    updateImg,
    updateColor
} from './function.js';
const listImg = document.querySelector('.viewport .listImg');
let selected_color,
    selected_version,
    options_color,
    activeNow = 0,
    currentQuantity = 1,
    total = 0,
    current_version,
    brand_name,
    category_name,
    avgReview = 0,
    totalPage =1 ,
    currentPage= 1;
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
function updateColorUI(data){
    const colorBox = document.querySelector('.productBox .colorBox');
    const options_color = data.current_options.map(version => version.color);
    for (const color of options_color) {
        const colorSubBox = document.createElement('div');
        colorSubBox.className = 'color';
        if (color === selected_color) {
            colorSubBox.classList.add('active');
        }
        colorSubBox.setAttribute('data-color', color);
        colorSubBox.addEventListener('click', (e) =>
        {
            updateColor(e, {
                current_versions: data.current_options,
                getCurrentVersion: getCurrentVersion,
                setCurrentVersion: setCurrentVersion,
                listImg: listImg,
                priceBox: priceBox,
                numberQuantity: numberQuantity,
                detailsBox: detailsBox,
                category_name: category_name,
                brand_name: brand_name,
                setSelectedColor: setSelectedColor,
                setCurrentQuantity: setCurrentQuantity,
                setActiveNow: setActiveNow,
            });
        });
        const p = document.createElement('p');
        p.innerText = color;
        colorSubBox.appendChild(p);

        colorBox.appendChild(colorSubBox);
    }
}
function updateVersionUI(all_options){
    for (const version of all_options){
        const a = document.createElement('a');
        a.className = 'category';
        if (version.slug === slugOption){
            a.classList.add('active');
            a.setAttribute('href', '#');
        }else{
            a.setAttribute('href', `/${slugCategory}/${slugProduct}/${version.slug}/`);
        }
        a.textContent = version.version;
        categoryBox.appendChild(a);
    }
}
function updateReviewsUI(reviews){
    const reviewBox = document.querySelector('main > .reviewBox');
    const reviewItemContainer = reviewBox.querySelector('.reviewItemContainer');
    reviewItemContainer.innerHTML = '';
    if (reviews.length > 0){
        for( const review of reviews){
            const name = review.user.username;
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
            const imgList = review.img;
            const imagesHTML = imgList && imgList.length > 0
            ? `
                <div class="imgReviewBox">
                    ${imgList.map(img => `<img src="${img.trim()}" alt="">`).join('')}
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
                        <p class="mainContent">${content}</p>
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
    const color = document.querySelector('.productBox .colorBox .color.active').textContent;
    const quantity = document.querySelector('.productBox .quantityBox .quantity p:nth-child(2)').textContent;
    let orderList = [];
    orderList.push({
        slugProduct,
        slugOption,
        color,
        quantity
    });
    localStorage.setItem('orderInfo', JSON.stringify(orderList));

    window.location.href = "/info_order/";
}
function addProductCart(slugProduct, slugOption){
    const color = document.querySelector('.productBox .colorBox .color.active').textContent;
    const quantity = document.querySelector('.productBox .quantityBox .quantity p:nth-child(2)').textContent;
    const product = {
        slugProduct,
        slugOption,
        color,
        quantity
    };
    console.log(product);
    fetchApiAddProductCart(product)
        .then(data => {
            console.log(data);
            popupModel.classList.add('active')
        })
}
window.onload = () => {
    fetchApiProduct(slug)
        .then(data => {
            if (data) {
                console.log(data);
                selected_color = data.current_options[0].color;
                selected_version = data.current_options[0].version;
                setCurrentVersion(data.current_options.find((version) => version.color === selected_color));
                setTotal(current_version.quantity);
                brand_name = data.brand.name;
                category_name = data.category.name;
                // name
                h3.textContent = data.product.name;
                // color
                updateColorUI(data);
                // version
                updateVersionUI(data.all_options);

                updatePrice(current_version, priceBox);
                updateImg(current_version, listImg);
                updateDetail(current_version, detailsBox, category_name, brand_name);
                updateDescription(current_version, descriptionBox);

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

