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
function fetchApiDeleteProduct(product_id) {
    const url = `/api/products/delete/${product_id}/`;
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'DELETE',
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
function fetchApiRestoreProduct(product_id) {
    const url = `/api/products/restore_product/${product_id}/`;
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
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
export { fetchApiGetProducts, fetchApiDeleteProduct, fetchApiRestoreProduct };