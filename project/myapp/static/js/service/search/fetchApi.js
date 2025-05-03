async function fetchApiSearch(dynamicUrl) {
    let url = `/api/search/${dynamicUrl}/`;
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.log('Lỗi khi lấy dữ liệu:', error);
        throw error;
    }
}

export { fetchApiSearch };
