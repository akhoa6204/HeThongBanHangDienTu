function fetchApiGetProducts(page, search) {
    const url = `/api/products/?page=${page}${search ? `&search=${search}` : ''}`;
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

export {fetchApiGetProducts};