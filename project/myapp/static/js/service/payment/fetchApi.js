import {getCookie} from '../utils/utils.js'
function fetchApiPayment(){
    const url = '/api/payment/'
    return fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken'),
            },
            credentials: 'include'
        })
        .then(response => {
            if (response.status >= 400){
                window.location.href = '/';
                return null;
            }
            return response.json();
        })
}

function fetchApiSuccessOrder(){
    const url = '/api/successOrder/';
    return fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                },
                credentials: 'include'
            })
            .then(response => response.json())
}
export {fetchApiPayment, fetchApiSuccessOrder};
