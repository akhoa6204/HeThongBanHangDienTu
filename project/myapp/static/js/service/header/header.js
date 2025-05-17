function fetchApiAuthenticated(){
    const url = '/api/authenticated/'
    return fetch(url, {
        method: 'GET',
        credentials: 'include',
    })
    .then(response => {
       if (!response.ok){
            throw new Error('Chưa đăng nhập');
       }
       return response.json();
    })
}
export {fetchApiAuthenticated}