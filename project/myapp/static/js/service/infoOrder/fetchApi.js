import {getCookie} from '../utils/utils.js'

function fetchApiOrder(orderInfo) {
    const url = '/api/order/';
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include',
        body: JSON.stringify(orderInfo)
    })
    .then(response => {
        if (!response.ok) {
            return null;
        }
        return response.json();
    })
    .catch(error => {
        console.log('Lỗi khi lấy dữ liệu:', error);
        throw error;  // Để thông báo lỗi được chuyển tiếp hoặc xử lý ở nơi gọi hàm
    });
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
function fetchApiOrderUser(userInfo){
    const url = '/api/setOrderUser/';
    return fetch(url, {
            method : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            credentials: 'include',
            body: JSON.stringify(userInfo)
        })
        .then(response => {
            response.json();
        })

}
export {fetchApiOrder, fetchApiCity, fetchApiDistricts, fetchApiWards, fetchApiOrderUser};