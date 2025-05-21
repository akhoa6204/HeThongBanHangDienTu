function fetchApiGet() {
    const url = '/api/products/create_get/';
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
function fetchApiPost(formData) {
    const url = '/api/products/create_post/';
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
function fetchApiPostCategory(category){
    const url = '/api/add_category/';
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({category})
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
function fetchApiPostBrand(brand){
    const url = '/api/add_brand/';
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({brand})
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
export {fetchApiGet, fetchApiPost, fetchApiPostCategory, fetchApiPostBrand};