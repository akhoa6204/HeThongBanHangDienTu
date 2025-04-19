import { fetchApiProduct } from './fetchApiProduct.js';
const listImg = document.querySelector('.viewport .listImg');
let selected_color,
    selected_version,
    options_color,
    activeNow = 0,
    currentQuantity = 1,
    lenListImg = listImg.children.length,
    total = 0,
    current_versions,
    brand_name,
    category_name;
const prevButton = document.querySelector(".buttonBox .prev");
const nextButton = document.querySelector(".buttonBox .next");
const priceBox = document.querySelector('.detail .priceBox');
const quantityBox = document.querySelector('.detail .quantityBox .quantity');
const prevQuantity = quantityBox.querySelector('p:first-child');
const numberQuantity = quantityBox.querySelector('p:nth-child(2)');
const nextQuantity = quantityBox.querySelector('p:last-child');
const detailsBox = document.querySelector('.detailsBox .main');
const descriptionBox = document.querySelector('.descriptionBox p');
const path = window.location.pathname;
const slugCategory = path.split('/')[1];
const slugProduct = path.split('/')[2];
const slugOption = path.split('/')[3];
const slug = {
    'category': slugCategory,
    'product': slugProduct,
    'option': slugOption
}
function fetchData(slug) {
    return fetchApiProduct(slug).catch(error => {
        console.error('Lỗi khi lấy dữ liệu:', error);
    });
}
function updatePrice() {
    let html = '';
    const result = current_versions.find((version) => version.color === selected_color);
    if (!result) return;
    const discount = result.discount || 0;
    const discountedPrice = result.price * (1 - discount);
    total = result.quantity;
    html += `
        <p class="afterDiscount">${discountedPrice.toLocaleString()} <u>đ</u></p>
        ${discount > 0 ? `
        <p class="beforeDiscount">
            <small><s>${result.price.toLocaleString()}₫</s></small>
        </p>` : ''}
    `;
    if (priceBox) {
        priceBox.innerHTML = html;
    }
};
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
};
function handleColor(e) {
    const colors = document.querySelectorAll('.color');
    colors.forEach(function(color) {
        color.classList.remove('active');
    });
    selected_color = e.currentTarget.getAttribute('data-color');
    e.currentTarget.classList.add('active');
    handleImg();
    activeNow = 0
    listImg.style.transform = `translateX(-${activeNow * 100}%)`;
    updatePrice();
    currentQuantity = 1;
    updateQuantity(currentQuantity);
    updateDetail();
};
function handleImg() {
    let html = "";
    current_versions.forEach(function(version) {
        if (version.version === selected_version && version.color === selected_color) {
            version.img.forEach(function(img) {
                html += `
                    <div class="item">
                        <img src="${img}" alt="">
                    </div>
                `;
            });
        }
    });

    // Thêm HTML vào listImg và versionDetails
    if (listImg) {
        listImg.innerHTML = html;
        lenListImg = listImg.children.length;
    }
};
function updateQuantity(quantity){
    numberQuantity.textContent = '';
    numberQuantity.textContent = quantity;
};
function updateDetail(){
    let html ='';
    const result = current_versions.find((version) => version.color === selected_color);
    if (!result) return;
    const memoryData = JSON.parse(result.memory_and_storage);
    const osCpu = JSON.parse(result.os_and_cpu);
    const rearCamera = JSON.parse(result.rear_camera);
    const display = JSON.parse(result.display);
    html += `
        <div class="detail">
            <p>Danh mục</p>
            <p>${category_name}</p>
        </div>
        <div class="detail">
            <p>Kho</p>
            <p>${result.quantity}</p>
        </div>
        <div class="detail">
            <p>Thương hiệu</p>
            <p>${brand_name}</p>
        </div>
        <div class="detail">
            <p>Dung lượng lưu trữ</p>
            <p>${ memoryData["Bộ nhớ trong"] }</p>
        </div>
        <div class="detail">
            <p>Loại bảo hành</p>
            <p>Bảo hành nhà sản xuất</p>
        </div>
        <div class="detail">
            <p>Hạn bảo hành</p>
            <p>12 tháng</p>
        </div>
        <div class="detail">
            <p>Bộ xử lý</p>
            <p>${osCpu["Vi xử lý"]}</p>
        </div>
        <div class="detail">
            <p>Độ phân giải camera chính</p>
            <p>${rearCamera["Độ phân giải camera"]}</p>
        </div>
        <div class="detail">
            <p>Kích thước màn hình</p>
            <p>${display["Kích thước màn hình"].replace(/^"|"$/g, "")} inches</p>
        </div>
    `;
    detailsBox.innerHTML = '';
    detailsBox.innerHTML =html;
};
function updateDescription(){
    let html ='';
    const result = current_versions.find((version) => version.color === selected_color);
    if (!result) return;
    descriptionBox.innerHTML = '';
    let formattedDescription = result.description
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

};
function onload(){
    updatePrice();
    handleImg();
    updateDetail();
    updateDescription();
}
fetchData(slug).then(data => {
    if (data) {
        selected_color = data.current_options[0].color;
        selected_version = data.current_options[0].version;
        options_color = data.current_options.map(version => version.color);
        current_versions = data.current_options;
        brand_name = data.brand.name;
        category_name = data.category.name;
        onload();
        nextButton.addEventListener("click", nextImg);
        prevButton.addEventListener("click", prevImg);
        prevQuantity.addEventListener("click", () => {
            currentQuantity = currentQuantity - 1 > 0  ? currentQuantity - 1  : 1;
            updateQuantity(currentQuantity);
        });
        nextQuantity.addEventListener("click", () => {
            currentQuantity = (currentQuantity + 1 <= total) ? currentQuantity + 1 : currentQuantity;
            updateQuantity(currentQuantity);
        });

        setInterval(nextImg, 3000);
    }
});

