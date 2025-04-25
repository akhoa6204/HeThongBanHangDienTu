import { getCookie } from '../utils/utils.js';

function fetchApiCart() {
    const url = '/api/cart/';
    return fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include'
    })
    .then(response => {
        return response.json().then(data => {
            if (!response.ok) {
                console.error('Lỗi từ server:', data);
                throw new Error(data.detail || 'Có lỗi xảy ra khi tải giỏ hàng.');
            }
            return data;
        });
    })
    .catch(error => {
        console.error('Lỗi khi gọi API:', error.message);
        throw error;
    });
}
function fetchApiRemoveCartItem(productList){
    const url = '/api/cart/remove_item/';
    return fetch(url, {
        method: 'DELETE',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include',
        body: JSON.stringify(productList)
    })
    .then(response => response.json())
}
function fetchApiUpdateQuantityCartItem(product){
    const url = '/api/cart/update_quantity_item/';
    return fetch(url, {
        method: 'PATCH',
        headers:{
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include',
        body: JSON.stringify(product)
    })
    .then(response => response.json())
}
export {fetchApiCart, fetchApiRemoveCartItem, fetchApiUpdateQuantityCartItem};