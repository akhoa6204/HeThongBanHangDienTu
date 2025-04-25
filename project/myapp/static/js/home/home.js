import { fetchApiHome } from '../service/home/fetchApi.js'
let activeNow = 0;
let listImg = document.querySelector(".listImg");
let prevButton = document.querySelector(".buttonBox .prev");
let nextButton = document.querySelector(".buttonBox .next");
const lenListImg = listImg.children.length;
const main = document.querySelector('main');
function nextImg(){
  if (activeNow >= lenListImg - 1){
    activeNow = 0;
  }else{
    activeNow = activeNow + 1;
  }
  listImg.style.transform = `translateX(-${activeNow * 100}%)`;
}
function prevImg(){
  if (activeNow == 0){
    activeNow = lenListImg - 1;
  }else{
    activeNow = activeNow - 1;
  }
  console.log(activeNow)
  listImg.style.transform = `translateX(-${activeNow * 100}%)`;
}

nextButton.addEventListener("click", nextImg);
prevButton.addEventListener("click", prevImg);
setInterval(nextImg, 3000);
fetchApiHome()
    .then(data => {
        console.log(data);
        for (const category of data) {
            const productContainer = document.createElement('section');
            productContainer.classList.add('productContainer');

            // Tạo phần chứa Tiêu đề
            const sectionTitle = document.createElement('div');
            sectionTitle.classList.add('section-title');

            sectionTitle.innerHTML = `
                <h2>${category.name} nổi bật</h2>
                <p>Xem tất cả</p>
                <span class="material-symbols-outlined">chevron_right</span>
            `;
            productContainer.appendChild(sectionTitle);

            // Tạo phần chứa sản phẩm
            const productBox = document.createElement('div');
            productBox.classList.add('productBox');

            for (const option of category.options) {
                const productItem = document.createElement('div');
                productItem.classList.add('product-item');

                const hasDiscount = option.discount > 0;

                productItem.innerHTML = `
                    <div class="header">
                        ${hasDiscount ? `<div class="discount">Giảm ${option.discount}%</div>` : ''}
                    </div>
                    <div class="product-image">
                        <a href="/${category.slug}/${option.product.slug}/${option.slug}/">
                            <img src="${option.product.img}" />
                        </a>
                    </div>
                    <div class="name-product">
                        <a href="/${category.slug}/${option.product.slug}/${option.slug}/">
                            <p>${option.product.name}</p>
                        </a>
                    </div>
                    <div class="price" style ='margin-bottom:10px;'>
                        <span style="color: red; font-weight: 600;">${Number(option.price).toLocaleString('vi-VN')} <u>đ</u></span>
                        ${hasDiscount ? `<span style="color: rgb(153,153,153); font-weight: 600; text-decoration: line-through;">${option.product.old_price}</span>` : ''}
                    </div>
                `;

                productBox.appendChild(productItem);
            }

            productContainer.appendChild(productBox);
            main.appendChild(productContainer);
        }
    })
    .catch(error => {
        console.error("Lỗi khi fetch dữ liệu:", error);
    });
