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
    if (data.length < 1) {return};
    for(const option of data){
        const srcImg = option.img ? option.img[0] : option.product.img[0];
        const name = option.product.name + ' - ' + option.version + " - " + option.color;
        const quantity = option.quantity;
        totalQuantity += Number(quantity);
        const price = option.discount ? (option.price - option.price * option.discount) * quantity : option.price * quantity;
        const html = `
            <div class="product">
                  <img src = "${srcImg}" alt = ""/>
                  <div class="product-info">
                    <h3>${name}</h3>
                    <div>
                        <span class="price">${(price).toLocaleString('vi-VN')}đ</span>
                        ${option.discount ? `<span class="old-price">${(option.price * quantity).toLocaleString('vi-VN')}đ</span>` : ''}
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
            citySelect.innerHTML += `<option value="${city.code}" ${addressUser && city.name === addressUser.split(' - ')[0] ? 'selected' : ''} code="${city.code}">${city.name}</option>`;
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
            districtSelect.innerHTML += `<option value="${district.code}" ${addressUser && district.name === addressUser.split(' - ')[1] ? 'selected' : ''}>${district.name}</option>`;
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
            wardSelect.innerHTML += `<option value="${ward.code}" ${addressUser && ward.name === addressUser.split(' - ')[2] ? 'selected' : ''}>${ward.name}</option>`;
        }
    });
};

function loadAddress(addressUser){
    loadCities(addressUser);
    address_detail.value = addressUser.split(' - ')[3] ? addressUser.split(' - ')[3] : '';
}

fetchApiOrder()
    .then(data => {
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
            const checkBoxEmail = document.querySelector('#acceptEmail');
            const checkBoxBill = document.querySelector('#acceptBill');
            const acceptEmail = checkBoxEmail.checked;
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
                acceptEmail,
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
    });
