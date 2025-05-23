import {fetchApiOrder} from '../service/orderStatus/fetchApi.js';

const path = window.location.pathname;
const orderId = path.split('/')[2];
const main = document.querySelector('main');
function formatDate(dateString) {
    // Loại bỏ phần microseconds nếu có (".247929")
    const cleanDateString = dateString.split('.')[0] + 'Z';

    const date = new Date(cleanDateString);

    if (isNaN(date)) return 'Không hợp lệ';

    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');

    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();

    return `${hours}:${minutes} ${day}-${month}-${year}`;
}
function loadHeader(id, status, need_invoice){
    let status_format = '';
    if (status === 'pending'){
        status_format = 'Chờ xác nhận';
    }else if(status === 'processing'){
        status_format = 'Đang xử lý';
    }else if(status === 'shipping'){
        status_format = 'Đang giao hàng';
    }else if(status === 'shipped'){
        status_format = 'Đã giao hàng';
    }else if(status === 'cancelled'){
        status_format = 'Đã hủy';
    }
    const html = `
        <section class="orderStatusHeader">
            <div class="back">
                <span class="material-symbols-outlined">arrow_back</span>
                <span>Trở lại</span>
            </div>
            ${need_invoice ? `
                <div class="need_invoice" style="flex: 1;text-align: right;">
                    <span style="padding: 4px 8px;color: rgba(222, 136, 5, 1);background-color: rgba(246, 159, 28, 0.38);">Yều cầu hóa đơn</span>
                </div>
            ` : ''}
            <div class="infoOrder">
                <span>Mã đơn hàng: <span style="color:rgba(0, 85, 170, 1);">${id}</span></span>
                <span>${status_format}</span>
            </div>
        </section>
    `;
    main.innerHTML += html;
}
function loadStatus(order){
    const status = order.status;
    let status_format = '';
    if (status === 'pending'){
        status_format = 'Chờ xác nhận';
    } else if(status === 'processing'){
        status_format = 'Đang xử lý';
    } else if(status === 'shipping'){
        status_format = 'Đang giao hàng';
    } else if(status === 'shipped'){
        status_format = 'Đã giao hàng';
    } else if(status === 'cancelled'){
        status_format = 'Đã hủy';
    }

    const statusSteps = ['Chờ xác nhận', 'Đang xử lý', 'Đang giao hàng', 'Đã giao hàng'];
    const currentIndex = statusSteps.indexOf(status_format);

    const icons = {
        'Chờ xác nhận': 'fact_check',
        'Đang xử lý': 'inventory_2',
        'Đang giao hàng': 'local_shipping',
        'Đã giao hàng': 'shopping_bag',
    };

    const timeKeys = {
        'Chờ xác nhận': 'pending_at',
        'Đang xử lý': 'processing_at',
        'Đang giao hàng': 'shipping_at',
        'Đã giao hàng': 'shipped_at',
    };

    let html = `<section class="orderStatusInfo">`;

    statusSteps.forEach((step, index) => {
        // Thêm mũi tên nếu không phải bước đầu tiên
        if(index > 0) {
            // Mũi tên trước trạng thái hiện tại và trước đó có active
            const arrowClass = (index <= currentIndex) ? 'active' : '';
            html += `<span class="material-symbols-outlined arrow_forward ${arrowClass}">arrow_forward</span>`;
        }

        // Class cho trạng thái
        let boxClass = '';
        if(index === currentIndex){
            boxClass = 'active';
        } else if(index < currentIndex){
            boxClass = 'after-active';
        }

        html += `
            <div class="box ${boxClass}">
                <span class="material-symbols-outlined">${icons[step]}</span>
                <span>${step}</span>
                ${order[timeKeys[step]] ? `<span>${formatDate(order[timeKeys[step]])}</span>` : ''}
            </div>
        `;
    });

    html += `</section>`;

    main.innerHTML += html;
}


function loadProduct(data){
    const totalPrice = (Number(data.total_price)).toLocaleString('vn-VN');
    const html = `
        <section class="orderStatusInfoOder">
            <div class="orderItemBox">
                ${data.orderItem.map((item,index) =>{
                    const oldPrice = (item.product.options[0].colors[0].price * item.quantity).toLocaleString('vn-VN');
                    const price = ((item.product.options[0].colors[0].price - (item.product.options[0].colors[0].price * item.product.options[0].discount)) * item.quantity).toLocaleString('vn-VN');
                    return `
                        <div class="orderItem">
                            <div class="imgBox">
                                <img src = "${item.product.options[0].colors[0].images[0].img}"
                                     alt="">
                            </div>
                            <div class="info">
                                <p class="name">${item.product.name} - ${item.product.options[0].version} - ${item.product.options[0].colors[0].color}</p>
                                <div>
                                    <div class="quantity">Số lượng <span style='color: red;'>${item.quantity}</span></div>
                                    <div class="price">
                                        ${item.product.options[0].discount > 0 ?
                                            `<strike style="color:rgba(136, 135, 135, 1); font-size: 14px;">${oldPrice}đ</strike>`:
                                            ''
                                        }
                                        <strong><span style="color:red; font-size: 16px;">${price}đ</span></strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="orderItemTotalPrice">
                <div class="row">
                    <p>Tổng tiền hàng</p>
                    <p>${totalPrice}đ</p>
                </div>
                <div class="row">
                    <p>Phí vận chuyển</p>
                    <p>Miễn phí</p>
                </div>
                <div class="row">
                    <p>Mã giảm giá</p>
                    <p>Không</p>
                </div>
                <div class="row">
                    <p>Thành tiền</p>
                    <p style="color:red; font-size :18px;">${totalPrice}đ</p>
                </div>
                <i>
                    <small>Vui lòng thanh toán <span style="color:red;">${totalPrice}đ</span> khi nhận hàng</small>
                </i>
            </div>
        </section>
    `;
    main.innerHTML += html;
}
function setUpEventListener(){
    const back = document.querySelector('.orderStatusHeader .back');
    back.addEventListener('click', () =>{
        window.location.href='/purchase/';
    })
}
fetchApiOrder(orderId)
.then(data => {
    if(data){
        console.log(data);
        loadHeader(data.order.id, data.order.status, data.order.need_invoice);
        loadStatus(data.order);
        loadProduct(data.order);
        setUpEventListener();
    }else{
        window.location.href= '/purchase/';
    }
})