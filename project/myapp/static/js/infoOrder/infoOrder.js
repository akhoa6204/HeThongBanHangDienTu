import { fetchApiOrder, fetchApiCity, fetchApiDistricts, fetchApiWards, fetchApiOrderUser } from '../service/infoOrder/fetchApi.js';

const productBox = document.querySelector('.productBox');
const summaryPrice = document.querySelector('.summary-price');
const infoCustomer= document.querySelector('.infoCustomer.info');
const infoAddressCustomer = document.querySelector('.infoCustomer.address');
const address_detail= document.querySelector('#address_detail');
let addressUser = null;
let total = 0;
const buyBtn = document.querySelector('.buy-btn');
let totalQuantity = 0;
function setAddressUser(value){
    addressUser = value;
}
function getAddressUser(){
    return addressUser;
}

function loadData(data){
    if (data.length < 1) return;
    for(const item of data){
        if (item.error) return;
        const srcImg = item.product.options[0].colors[0].images[0].img ? item.product.options[0].colors[0].images[0].img : item.product.images[0].img;
;
        const name = item.product.name + ' - ' + item.product.options[0].version + " - " + item.product.options[0].colors[0].color;
        const quantity = item.quantity;
        totalQuantity += Number(quantity);
            const price = item.product.options[0].discount ? (Number(item.product.options[0].colors[0].price) - Number(item.product.options[0].colors[0].price) * Number(item.product.options[0].discount)) * quantity : item.product.options[0].colors[0].price * quantity;
        const html = `
            <div class="product">
                  <img src = "${srcImg}" alt = ""/>
                  <div class="product-info">
                    <h3>${name}</h3>
                    <div>
                        <span class="price">${(price).toLocaleString('vi-VN')}đ</span>
                        ${item.product.options[0].discount ? `<span class="old-price">${(item.product.options[0].colors[0].price * quantity).toLocaleString('vi-VN')}đ</span>` : ''}
                    </div>
                    <div>Số lượng: ${quantity}</div>
                  </div>
            </div>
        `;
        total += price;
        productBox.innerHTML += html;
    }
    summaryPrice.textContent = `${total.toLocaleString('vi-VN')}đ`;
};

function loadInfo(user){
    const nameCustomer = infoCustomer.querySelector('.nameCustomer');
    const emailCustomer = infoCustomer.querySelector('.emailCustomer');
    nameCustomer.innerHTML = `<strong>${user.first_name} ${user.last_name}</strong>`;
    emailCustomer.innerHTML = `<strong>EMAIL</strong><br>${user.email}`;
};

function loadCities(addressUser) {
    const citySelect = infoAddressCustomer.querySelector('.city select');
    fetchApiCity().then(cities => {
        citySelect.innerHTML = '';
        for (const city of cities) {
            citySelect.innerHTML += `<option value="${city.code}" ${addressUser && city.name.includes(addressUser.split(' - ')[0]) ? 'selected' : ''} code="${city.code}">${city.name}</option>`;
        }

        const selectedCityCode = citySelect.value;
        loadDistricts(selectedCityCode);

        citySelect.addEventListener('change', () => {
            const selectedCode = citySelect.value;
            loadDistricts(selectedCode);
        });
    });
};

function loadDistricts(cityCode) {
    const districtSelect = infoAddressCustomer.querySelector('.district select');
    const wardSelect = infoAddressCustomer.querySelector('.ward select');
    districtSelect.innerHTML = '';
    wardSelect.innerHTML = '';

    fetchApiDistricts(cityCode).then(cityData => {
        for (const district of cityData.districts) {
            districtSelect.innerHTML += `<option value="${district.code}" ${addressUser && district.name.includes(addressUser.split(' - ')[1]) ? 'selected' : ''}>${district.name}</option>`;
        }

        loadWards(districtSelect.value);

        districtSelect.addEventListener('change', () => {
            const selectedDistrictCode = districtSelect.value;
            loadWards(selectedDistrictCode);
        });
    });
};

function loadWards(districtCode) {
    const wardSelect = document.querySelector('.ward select');
    wardSelect.innerHTML = '';

    fetchApiWards(districtCode).then(districtData => {
        for (const ward of districtData.wards) {
            wardSelect.innerHTML += `<option value="${ward.code}" ${addressUser && ward.name.includes(addressUser.split(' - ')[2]) ? 'selected' : ''}>${ward.name}</option>`;
        }
    });
};

function loadAddress(addressUser){
    loadCities(addressUser);
    address_detail.value = addressUser.split(' - ')[3] ? addressUser.split(' - ')[3] : '';
}

fetchApiOrder()
    .then(data => {
        if(data){
            console.log(data);
            if (data.options.length > 0 && data.options[0].error){
                window.location.href= '/';
                return;
            }
            console.log(data);
            loadData(data.options);
            loadInfo(data.user);
            setAddressUser(data.user.address)
            loadAddress(getAddressUser());
            buyBtn.addEventListener('click', ()=>{
                const citySelect = document.querySelector('.city select');
                const city= citySelect.options[citySelect.selectedIndex].textContent;
                const districtSelect = document.querySelector('.district select');
                const district= districtSelect.options[districtSelect.selectedIndex].textContent;
                const wardSelect = document.querySelector('.ward select');
                const ward = wardSelect.options[wardSelect.selectedIndex].textContent;
                const address_detail = document.querySelector('#address_detail').value;
                if (!address_detail){
                    alert('Khách hàng cần điền đầy đủ thông tin nhận hàng');
                    return;
                }
                const note = document.querySelector('#note').value;
                const checkBoxBill = document.querySelector('#acceptBill');
                const acceptBill = checkBoxBill.checked;
                const userInfo = {
                    first_name:  data.user.first_name,
                    last_name:  data.user.last_name,
                    email:  data.user.email,
                    phone:  data.user.phone,
                    city,
                    district,
                    ward,
                    address_detail,
                    note,
                    acceptBill
                };

                const bill ={
                    totalPrice : total,
                    totalQuantity: totalQuantity,
                };
                fetchApiOrderUser({
                    userInfo,
                    bill
                })
                .then(data => {
                    window.location.href = "/payment_order/";
                })
            })
        }else{
             window.location.href= '/';
             return;
        }
    });
