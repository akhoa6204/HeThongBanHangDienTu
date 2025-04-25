function updatePrice(current_version, priceBox) {
    let html = '';
    if (!current_version) return;
    const discount = current_version.discount || 0;
    const discountedPrice = current_version.price * (1 - discount);

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

function updateDetail(current_version, detailsBox, category_name, brand_name) {
    if (!current_version) return;

    const memoryData = JSON.parse(current_version.memory_and_storage);
    const osCpu = JSON.parse(current_version.os_and_cpu);
    const rearCamera = JSON.parse(current_version.rear_camera);
    const display = JSON.parse(current_version.display);

    detailsBox.innerHTML = `
        <div class="detail"><p>Danh mục</p><p>${category_name}</p></div>
        <div class="detail"><p>Kho</p><p>${current_version.quantity}</p></div>
        <div class="detail"><p>Thương hiệu</p><p>${brand_name}</p></div>
        <div class="detail"><p>Dung lượng lưu trữ</p><p>${memoryData["Bộ nhớ trong"]}</p></div>
        <div class="detail"><p>Loại bảo hành</p><p>Bảo hành nhà sản xuất</p></div>
        <div class="detail"><p>Hạn bảo hành</p><p>12 tháng</p></div>
        <div class="detail"><p>Bộ xử lý</p><p>${osCpu["Vi xử lý"]}</p></div>
        <div class="detail"><p>Độ phân giải camera chính</p><p>${rearCamera["Độ phân giải camera"]}</p></div>
        <div class="detail"><p>Kích thước màn hình</p><p>${display["Kích thước màn hình"].replace(/^"|"$/g, "")} inches</p></div>
    `;
}

function updateDescription(current_version, descriptionBox) {
    if (!current_version) return;

    let formattedDescription = current_version.description
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

function updateReviewsForStar(number, reviewBox) {
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

function updateImg(current_version, listImg) {
    let html = "";
    current_version.img.forEach(img => {
        html += `<div class="item"><img src="${img}" alt=""></div>`;
    });
    if (listImg) listImg.innerHTML = html;
}

function updateColor(e, options) {
    const {
        current_versions,
        getCurrentVersion,
        setCurrentVersion,
        listImg,
        priceBox,
        numberQuantity,
        detailsBox,
        category_name,
        brand_name,
        setSelectedColor,
        setCurrentQuantity,
        setActiveNow,
    } = options;

    document.querySelectorAll('.color').forEach(color => color.classList.remove('active'));
    const selected_color = e.currentTarget.getAttribute('data-color');
    e.currentTarget.classList.add('active');

    setSelectedColor(selected_color);

    setCurrentVersion(current_versions.find(version => version.color === selected_color));
    const current_version = getCurrentVersion();

    setActiveNow(0);
    listImg.style.transform = `translateX(0%)`;

    updatePrice(current_version, priceBox);

    setCurrentQuantity(1);
    numberQuantity.textContent = 1;

    updateImg(current_version, listImg);
    updateDetail(current_version, detailsBox, category_name, brand_name);
}

export {
    updatePrice,
    updateDetail,
    updateDescription,
    updateReviewsForStar,
    updateImg,
    updateColor
};
