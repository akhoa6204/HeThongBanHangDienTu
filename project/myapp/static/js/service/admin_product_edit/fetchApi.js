function fetchApiGetData(productId) {
    const url = `/api/products/${productId}/`;
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
function fetchApiUpdateProduct(productId, formData) {
    const url = `/api/products/update_product/${productId}/`;
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                },
                credentials: 'include',
                body: formData
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
function fetchApiUpdateOption(productId, optionId, formData) {
    let url = `/api/products/update_option/${productId}/`;
    if(optionId){
        url += `${optionId}/`;
    }
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                },
                credentials: 'include',
                body: formData
            });
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        });
}
function fetchApiDeleteOption(option_id){
    const url = `/api/products/delete_option/${option_id}/`;

    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'DELETE',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                },
                credentials: 'include',
            });
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        });
}
export { fetchApiGetData, fetchApiUpdateProduct, fetchApiUpdateOption, fetchApiDeleteOption };