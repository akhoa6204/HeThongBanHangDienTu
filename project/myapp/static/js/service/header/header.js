function fetchApiAuthenticated(){
    const url = '/api/authenticated/'
    return fetch(url)
        .then(response => {
           return response.json()
        })
        .catch(error => {
            return null;
        });
}
export {fetchApiAuthenticated}