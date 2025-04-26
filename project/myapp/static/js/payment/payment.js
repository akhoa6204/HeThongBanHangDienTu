import { fetchApiPayment, fetchApiSuccessOrder } from '../service/payment/fetchApi.js';
const rowPrice = document.querySelector('.row.price');
const rowShip = document.querySelector('.row.ship');
const rowQuantity = document.querySelector('.row.quantity');
const rowTotalPrice = document.querySelector('.row.totalPrice');
const rowName = document.querySelector('.row.name');
const rowPhone = document.querySelector('.row.phone');
const rowEmail = document.querySelector('.row.email');
const rowAddress = document.querySelector('.row.address');
const buyBtn = document.querySelector('.buy-btn');
const checkbox = document.querySelector('#checkBox');
const main = document.querySelector('main');
const summaryPrice = document.querySelector('.summary-price');
function loadDataOrder(order){
    const quantity = rowQuantity.querySelector('p:last-child');
    const ship = rowShip.querySelector('p:last-child');
    const price = rowPrice.querySelector('p:last-child');
    const totalPrice = rowTotalPrice.querySelector('p:last-child');
    quantity.textContent = order.totalQuantity;
    price.textContent = `${(order.totalPrice).toLocaleString('vn-VN')}đ `;
    totalPrice.textContent = `${(order.totalPrice).toLocaleString('vn-VN')}đ `;
    summaryPrice.textContent = `${(order.totalPrice).toLocaleString('vn-VN')}đ `;
}
function loadDataUser(user){
    const name = rowName.querySelector('p:last-child');
    const phone = rowPhone.querySelector('p:last-child');
    const email = rowEmail.querySelector('p:last-child');
    const address = rowAddress.querySelector('p:last-child');

    const stringName = user.first_name + ' ' + user.last_name
    const stringAddress = user.address_detail + ", " + user.ward + ", " + user.district + ", " + user.city;
    name.textContent = stringName.trim();
    phone.textContent = user.phone;
    email.textContent = user.email;
    address.textContent= stringAddress;
}
window.onload = () => {
    fetchApiPayment()
        .then(data => {
              console.log('User Info from session:', data.userInfo);
              console.log('Bill from session:', data.bill);
              console.log('orderInfo from session:', data.orderInfo);
              loadDataOrder(data.bill);
              loadDataUser(data.userInfo);
              buyBtn.addEventListener('click', ()=>{
                if (checkbox && checkbox.checked){
                    console.log('Hoàn tất mua hàng');
                    fetchApiSuccessOrder()
                    .then(data => {
                        if (data.detail === 'Đặt hàng thành công'){
                            main.innerHTML = `
                                <section class="orderSuccess">
                                    <div class="container">
                                        <div class="icon">
                                            <img src="${imgSrc}" alt="">
                                            <p>Đặt hàng thành công</p>
                                        </div>
                                        <p>Chỉ nhận hàng & thanh toán khi đơn mua ở trạng thái “Đang giao hàng”.</p>
                                        <div class="button">
                                            <button>Trang chủ</button>
                                            <button>Đơn mua</button>
                                        </div>
                                    </div>
                                </section>
                            `;
                            ;
                            const orderSuccess = document.querySelector('.orderSuccess');
                            const container = document.querySelector('.orderSuccess .container');
                            const homeButton = document.querySelector('.orderSuccess .button button:first-child');
                            const orderButton = document.querySelector('.orderSuccess .button button:last-child');
                            container.addEventListener('click', (e) => {
                                e.stopPropagation();
                            });
                            homeButton.addEventListener('click', () => {
                                window.location.href = '/';
                            });

                            orderSuccess.addEventListener('click', () => {
                                window.location.href = '/';
                            });
                        }
                    })
                }else{
                    alert('Khách hàng cần đồng ý với các Điều khoản sử dụng của Store.')
                }
              })
        })
}
