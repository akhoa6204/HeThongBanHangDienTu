function fetchApiOrderItem(orderId){
    const url = `/api/review/${orderId}`;
    return cookieStore.get('csrftoken')
        .then(cookie =>{
            if (!cookie){
                throw new Error('Không tìm thấy CSRF token');
            }
            return fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookie.value,
                },
                credentials: 'include',
            })
        })
        .then(response => {
            if(!response.ok) return null;
            return response.json();
        })
}
function fetchAddNewReview(orderId, formData){
    const url = `/api/add_new_review/${orderId}/`;
    return cookieStore.get('csrftoken')
        .then(cookie => {
            if(!cookie){
                throw new Error('Không tìm thấy CSRF token');
            }
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': cookie.value,
                },
                credentials: 'include',
                body: formData,
            })
        })
        .then(response => response.json())
}
export {fetchApiOrderItem, fetchAddNewReview}