import {getCookie} from '../utils/utils.js'

async function fetchApiOrder(orderInfo){
    const url = '/api/order/';
    const response = await fetch(url,{
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': getCookie('csrftoken'),
      },
      credentials: 'include',
      body: JSON.stringify(orderInfo)
    });
    try{
        if(!response.ok){
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    }catch (error) {
        console.log('Lỗi khi lấy dữ liệu:', error);
        throw error;
    }
}
function fetchApiCity() {
    const url = 'https://provinces.open-api.vn/api/p/';
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.log('Lỗi khi lấy dữ liệu:', error);
            throw error;
        });
}

function fetchApiDistricts(code) {
    const url = `https://provinces.open-api.vn/api/p/${code}?depth=2`;
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.log('Lỗi khi lấy dữ liệu:', error);
            throw error;
        });
}
function fetchApiWards(code) {
    const url = `https://provinces.open-api.vn/api/d/${code}?depth=2`;
    return fetch(url)
        .then(response => response.json())
        .catch(error => {
            console.log('Lỗi khi lấy dữ liệu:', error);
            throw error;
        });
}

export {fetchApiOrder, fetchApiCity, fetchApiDistricts, fetchApiWards};