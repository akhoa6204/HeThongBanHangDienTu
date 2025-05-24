function fetchApiGet(orderId) {
    const url = `/api/orders/${orderId}`;
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
        })
        .then(async res => {
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        })
}
function fetchApiCancelOrder(orderId, cancelReason, note=''){
    const url = `/api/orders/cancel/${orderId}/`;
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'PATCH',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ cancelReason, note })
            });
        })
        .then(async res => {
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        })
}
export {fetchApiGet, fetchApiCancelOrder};