function fetchOrder(status, page){
    const url = `/api/purchase/${status}/${page}/`;
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
        .then(response => response.json())
}
export {fetchOrder};