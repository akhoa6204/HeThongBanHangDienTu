function fetchApiOrder(orderId){
    const url = `/api/order_status/${orderId}/`;
    return cookieStore.get('csrftoken')
        .then(cookie =>
            fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookie.value,
                },
                credentials: 'include',
        }))
        .then(response => response.json())
}
export {fetchApiOrder};