import {fetchOrder, fetchUpdateStatusOrder} from '../service/order/fetchApi.js';
import { fetchApiSetOrderProduct } from '../service/detail/fetchApi.js';
const statusAll = document.querySelectorAll('.header .status');
const all = document.querySelector('.header .status.all');
const pending = document.querySelector('.header .status.pending');
const processing = document.querySelector('.header .status.processing');
const shipped = document.querySelector('.header .status.shipped');
const cancelled = document.querySelector('.header .status.cancelled');
const shipping = document.querySelector('.header .status.shipping');
const orderContainer = document.querySelector('.orderContainer');
let currentPage = 1;
let load = true;
let currentTag = 'all';
let noMoreData = false;
let isLoading = false;
let first_time = false;
let selectedOrderId = null;
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const closeCancelPopup = document.getElementById('closeCancelPopup');
const popupContainer= document.querySelector('.popupContainer');
const box= popupContainer.querySelector('.box');

function setIsLoading(value){
    isLoading = value;
}
function setCurrentTag(value){
    currentTag = value;
}
function getCurrentTag(){
    return currentTag;
}
function setCurrentPage(value){
    currentPage = value;
}
function getCurrentPage(){
    return currentPage;
}
function setLoad(value){
    load = value;
}
function getLoad(){
    return load;
}
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
function updateHeader(tag) {
    statusAll.forEach(status => {
        if (status.classList.contains(tag)) {
            if (!status.classList.contains('active')) {
                status.classList.add('active');
            }
        } else {
            status.classList.remove('active');
        }
    });
}
function attachEventListeners(data){
    const productsPerPage = 5;
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = currentPage * productsPerPage - 1;
    const orderBoxAll = document.querySelectorAll('.orderBox');
    const orderBoxAllForCurrentPage = Array.from(orderBoxAll).slice(startIndex, endIndex + 1);

    console.log(orderBoxAllForCurrentPage);
    orderBoxAllForCurrentPage.forEach((orderBox, index) =>{
        const productContainer = orderBox.querySelector('.productContainer');
        productContainer.addEventListener('click', () => {
            window.location.href = `/order_status/${data[index].id}`;
        });
        const buttonBox = orderBox.querySelector('.buttonBox');
        if (buttonBox){
            const reviewButton = buttonBox.querySelector('.reviewBtn');
            const buyButton = buttonBox.querySelector('.buyBtn');
            const cancelBtn = buttonBox.querySelector('.cancelBtn');
            if (reviewButton) {
                reviewButton.addEventListener('click', () => {
                    window.location.href = `/review/${data[index].id}`;
                });
            }
            if (buyButton) {
                buyButton.addEventListener('click', () =>{
                    const productList = [];
                    const orderItem = data[index].orderItem;
                    orderItem.forEach((item, index) => {
                        console.log(item);
                        productList.push({
                            slugProduct: item.product.slug,
                            slugOption: item.product.options[0].slug,
                            color: item.product.options[0].colors[0].color,
                            quantity: item.quantity,
                        });
                    });
                    fetchApiSetOrderProduct(productList)
                    .then(data => {
                        window.location.href = "/info_order/";
                    })
                })
            }
            if (cancelBtn){
//                cancelBtn.addEventListener('click', () => {
//                    console.log(data[index]);
//                    fetchUpdateStatusOrder(data[index].id)
//                    .then(data=> {
//                        if(data.detail == "Cập nhật trạng thái thành công"){
//                            cancelled.click();
//                        }
//                    })
//                })
                cancelBtn.addEventListener('click', () => {
                  selectedOrderId = data[index].id;
                  document.getElementById('reason').value = '';
                  document.getElementById('note').value = '';
                  document.querySelector('.popupContainer').classList.add('active');
                });
            }
        }
    })
}

function loadOrderData(data){
    let html ='';
    if (data.length > 0){
        html = data.map((item, index) => {
            console.log(item.status);
            let status = '';
            if (item.status === 'pending'){
                status = 'Chờ xác nhận';
            }else if(item.status === 'processing'){
                status = 'Đang xử lý';
            }else if(item.status === 'shipping'){
                status = 'Đang giao hàng';
            }else if(item.status === 'shipped'){
                status = 'Đã giao hàng';
            }else if(item.status === 'cancelled'){
                status = 'Đã hủy';
            }
            const formattedDate = item.update_at && formatDate(item.update_at);
            return `
                <div class="orderBox">
                    <div class="status">
                        <span class="material-symbols-outlined">local_shipping</span>
                        <span>${status}</span>
                        <span>Cập nhật mới nhất: ${formattedDate}</span>
                    </div>
                    <div class='productContainer'>
                        ${item.orderItem.map((orderItem, index)=>{
                            const oldPrice = (orderItem.product.options[0].colors[0].price * orderItem.quantity).toLocaleString('vn-VN');
                            const price = ((orderItem.product.options[0].colors[0].price - (orderItem.product.options[0].colors[0].price * orderItem.product.options[0].discount)) * orderItem.quantity).toLocaleString('vn-VN');
                            return `
                                <div class="productBox">
                                    <img src="${orderItem.product.options[0].colors[0].images[0].img}"
                                         alt="img product">
                                    <div class="product">
                                        <span>${orderItem.product.name} - ${orderItem.product.options[0].version} - ${orderItem.product.options[0].colors[0].color}</span>
                                        <span>x${orderItem.quantity}</span>
                                    </div>
                                    <div class="priceBox">
                                        ${ orderItem.product.options[0].discount > 0 ? `<span class="oldPrice">${oldPrice}₫</span>` : ''}
                                        <span class="price">${price}₫</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <div class='totalPrice'>
                        <p>
                            Thành tiền: <span>${(Number(item.total_price)).toLocaleString('vn-VN')}₫</span>
                        </p>
                    </div>
                    ${item.status === 'shipped' ?
                        `<div class="buttonBox">
                            ${!item.has_review ? "<button class='reviewBtn'>Đánh giá</button>" : ''}
                            <button class='buyBtn'>Mua lại</button>
                        </div>` : ''
                    }
                    ${item.status === 'cancelled' ?
                        `<div class="buttonBox">
                            <button class='buyBtn'>Mua lại</button>
                        </div>` : ''
                    }
                    ${item.status === 'pending' ?
                        `<div class="buttonBox">
                            <button class='cancelBtn'>Huỷ đơn hàng</button>
                        </div>` : ''
                    }
                </div>
            `;
        }).join('');
    }
    else{
        html = `
            <div class ='emptyOrder'>
                <img src ="${urlEmptyOrder}" alt='img emptyOrder'/>
                <p>Chưa có đơn hàng nào</p>
            </div>
        `;
    }
    if (getLoad()){
        orderContainer.innerHTML = html;
    }else{
        orderContainer.insertAdjacentHTML('beforeend', html);
    }
    attachEventListeners(data);
}
function fetchApi(status, page) {
    if(!isLoading){
        setIsLoading(true);
        return fetchOrder(status, page)
            .then(data => {
                console.log(data);
                if (data.order.length === 0) {
                    noMoreData = true;
                }
                if(first_time && noMoreData) return;
                loadOrderData(data.order);
                updateHeader(status);
                setCurrentPage(page + 1);
            })
            .catch(error => {
                console.log('Error fetching data:', error);
            })
            .finally(() => {
                setLoad(false);
                setIsLoading(false);
                first_time = true;
            });
    }
}
function clickHeader(tag){
    first_time = false;
    setCurrentPage(1);
    setLoad(true);
    noMoreData = false;
    fetchApi(tag, getCurrentPage());
};
window.addEventListener('scroll', () => {
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100 && !noMoreData) {
        if (!getLoad()) {
            fetchApi(getCurrentTag(), getCurrentPage());
        }
    }
});
window.onload = () => {
    fetchApi(getCurrentTag(), getCurrentPage());
    all.addEventListener('click', () => {
        setCurrentTag('all');
        clickHeader(getCurrentTag());
    });
    pending.addEventListener('click', () => {
        setCurrentTag('pending');
        clickHeader(getCurrentTag());
    });
    processing.addEventListener('click', () => {
        setCurrentTag('processing');
        clickHeader(getCurrentTag());
    });
    shipping.addEventListener('click', () => {
        setCurrentTag('shipping');
        clickHeader(getCurrentTag());
    });
    shipped.addEventListener('click', () => {
        setCurrentTag('shipped');
        clickHeader(getCurrentTag());
    });
    cancelled.addEventListener('click', () => {
        setCurrentTag('cancelled');
        clickHeader(getCurrentTag());
    });
}

popupContainer.addEventListener('click', () =>{
    if (popupContainer.classList.contains('active')){
        popupContainer.classList.remove('active');
    }
})
box.addEventListener('click', (event) => {
    event.stopPropagation();
})
closeCancelPopup.addEventListener('click', () => {
  document.querySelector('.popupContainer').classList.remove('active');
});
confirmCancelBtn.addEventListener('click', () => {
  const reason = document.getElementById('reason').value.trim();
  const note = document.getElementById('note').value.trim();

  if (!reason) {
    alert("Vui lòng nhập lý do hủy.");
    return;
  }
  fetchUpdateStatusOrder(selectedOrderId, reason, note)
    .then(data => {
      if (data.detail === "Cập nhật trạng thái thành công") {
        document.getElementById('reason').value = '';
        document.getElementById('note').value = '';
        popupContainer.classList.remove('active');
        cancelled.click();
        const popupSuccess = document.querySelector('.popup-model.success.change_status');
        popupSuccess.classList.add('active');
      }
    })
    .catch(err => {
        document.getElementById('reason').value = '';
        document.getElementById('note').value = '';
        popupContainer.classList.remove('active');
        const popupError= document.querySelector('.popup-model.error.change_status');
        popupError.classList.add('active');
    });
});
