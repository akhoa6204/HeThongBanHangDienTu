export async function fetchApiProduct(slug) {
    if (!slug || !slug.category || !slug.product || !slug.option) {
        console.log("Invalid slug data");
        return;
    }

    const url = `/api/${slug.category}/${slug.product}/${slug.option}/`;

    return fetch(url)  // Trả về fetch promise
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .catch(error => {
            console.log('Lỗi khi lấy dữ liệu:', error);
            throw error;
        });
}
