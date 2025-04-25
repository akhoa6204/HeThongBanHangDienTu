import {getCookie} from '../utils/utils.js'
async function fetchApiProduct(slug) {
    if (!slug || !slug.category || !slug.product || !slug.option) {
        console.log("Invalid slug data");
        return;
    }

    const url = `/api/product/${slug.category}/${slug.product}/${slug.option}/`;

    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.log('Lỗi khi lấy dữ liệu:', error);
        throw error;
    }
}
async function fetchApiReviews(slug, page, star){
    const url = page ? `/api/reviews/${slug}/${star}/${page}/`:`/api/reviews/${slug}/${star}/1/`
    try{
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    }catch (error) {
        console.log('Lỗi khi lấy dữ liệu:', error);
        throw error;
    }
}
function fetchApiAddProductCart(product){
    const url = '/api/cart/addProduct/'
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
        },
        credentials: 'include',
        body: JSON.stringify(product)
    })
    .then(response => {
        return response.json()
        .then(data => {
        if (!response.ok) {
            alert(data.detail);
            throw new Error(data.detail || 'Đã xảy ra lỗi');
        }
        return data;
    });
})
}
export { fetchApiProduct, fetchApiReviews, fetchApiAddProductCart };
