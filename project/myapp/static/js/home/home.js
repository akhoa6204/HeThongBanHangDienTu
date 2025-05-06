import { fetchApiHome } from '../service/home/fetchApi.js'
let activeNow = 0;
const main = document.querySelector('main');
let listImg = null;
let prevButton = null;
let nextButton = null;
const subMenu = document.querySelector('.sub-menu');
function nextImg() {
    const len = listImg.children.length;
    if (activeNow >= len - 1) {
        activeNow = 0;
    } else {
        activeNow++;
    }
    listImg.style.transform = `translateX(-${activeNow * 100}%)`;
}

function prevImg(){
    const len = listImg.children.length;
    if (activeNow == 0){
        activeNow = len - 1;
    } else {
        activeNow = activeNow - 1;
    }
    listImg.style.transform = `translateX(-${activeNow * 100}%)`;
}
function loadData(data){
    for (const category of data) {
        subMenu.innerHTML += `
            <div class="child-menu">
                <span class="material-symbols-outlined">${category.name ==="Điện thoại" ? "phone_iphone" : "headphones"}</span>
                <span>${category.name}</span>
                <span class="material-symbols-outlined">chevron_right</span>
                ${category.name ==="Điện thoại" ? `
                    <div class='subChildMenu'>
                        <div class='brand'>
                            <p><strong>Hãng ${category.name}</strong></p>
                            ${category.brands.map(brand => {
                                return `
                                    <p>${brand.name}</p>
                                `;
                            }).join('')}

                        </div>
                        <div class='filterPrice'>
                            <p><strong>Mức giá</strong></p>
                            <p>Dưới 4 triệu</p>
                            <p>Từ 4 - 7 triệu</p>
                            <p>Từ 7 - 13 triệu</p>
                            <p>Từ 13 - 20 triệu</p>
                            <p>Từ 20 - 30 triệu</p>
                            <p>Trên 30 triệu</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        const productContainer = `
            <section class='productContainer'>
                <div class='section-title'>
                    <h2>${category.name} nổi bật</h2>
                    <p>Xem tất cả</p>
                    <span class="material-symbols-outlined">chevron_right</span>
                </div>
                <div class='productBox'>
                    ${
                        category.options.map((option) => {
                            const hasDiscount = option.discount > 0;
                            return `
                                <div class='product-item'>
                                    <div class="header">
                                        ${hasDiscount ? `<div class="discount">Giảm ${option.discount}%</div>` : ''}
                                    </div>
                                    <div class="product-image">
                                        <a href="/detail/${category.slug}/${option.product.slug}/${option.slug}/">
                                            <img src="${option.product.img}" />
                                        </a>
                                    </div>
                                    <div class="name-product">
                                        <a href="/detail/${category.slug}/${option.product.slug}/${option.slug}/">
                                            <p>${option.product.name}</p>
                                        </a>
                                    </div>
                                    <div class="price" style ='margin-bottom:10px;'>
                                        <span style="color: red; font-weight: 600;">${Number(option.price).toLocaleString('vi-VN')} <u>đ</u></span>
                                        ${hasDiscount ? `<span style="color: rgb(153,153,153); font-weight: 600; text-decoration: line-through;">${option.product.old_price}</span>` : ''}
                                    </div>
                                </div>
                            `;
                        }).join('')
                    }
                </div>
            </section>
        `;
        main.innerHTML += productContainer;
    }
}
function attachEventListener(data){
    const sectionTitleAll = document.querySelectorAll('.section-title');
    sectionTitleAll.forEach((sectionTitle, index) => {
        const p = sectionTitle.querySelector('p');
        const span = sectionTitle.querySelector('span');
        p.addEventListener('click', () => {
            window.location.href = `/search/?category=${data[index].slug}/`;
        })
        span.addEventListener('click', () => {
            window.location.href = `/search/?category=${data[index].slug}/`;
        })
    });
    const childMenuAll = document.querySelectorAll('.child-menu');
    childMenuAll.forEach((childMenu, index)=> {
        console.log(childMenu);
        const brands = childMenu.querySelectorAll('.brand p:not(:first-child)');
        brands.forEach((brand, subIndex) =>{
            brand.addEventListener('click', () => {
                console.log()
                window.location.href = `/search/?category=${data[index].slug}&brand=${data[index].brands[subIndex].slug}/`;
            })
        })
        const prices = childMenu.querySelectorAll('.filterPrice p:not(:first-child)');
        prices.forEach((price, subIndex) => {
            price.addEventListener('click', () =>{
                if (price.textContent.includes('Dưới')){
                    const priceNumber = parseInt(price.textContent.replace(/[^\d]/g, '')) * 1000000;
                    window.location.href = `/search/?category=${data[index].slug}&min_price=${0}&max_price=${priceNumber}/`;
                }else if(price.textContent.includes('Trên')){
                    const priceNumber = parseInt(price.textContent.replace(/[^\d]/g, '')) * 1000000;
                    window.location.href = `/search/?category=${data[index].slug}&min_price=${priceNumber}/`;
                }else{
                    const minPrice = parseInt(price.textContent.split('-')[0].replace(/[^\d]/g, '')) * 1000000;
                    const maxPrice = parseInt(price.textContent.split('-')[1].replace(/[^\d]/g, '')) * 1000000;
                    window.location.href = `/search/?category=${data[index].slug}&min_price=${minPrice}&max_price=${maxPrice}/`;
                }
            })
        })
    })
    nextButton.addEventListener("click", () => {
        nextImg();
    });
    prevButton.addEventListener("click", () => {
        prevImg();
    });
}
fetchApiHome()
    .then(data => {
        console.log(data);
        loadData(data);
        listImg = document.querySelector(".listImg");
        prevButton = document.querySelector(".buttonBox .prev");
        nextButton = document.querySelector(".buttonBox .next");
        attachEventListener(data);
        setInterval(nextImg, 3000);
    })
    .catch(error => {
        console.error("Lỗi khi fetch dữ liệu:", error);
    });

