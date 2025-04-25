async function fetchApiHome() {
    const url = '/api/home';

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
export {fetchApiHome};