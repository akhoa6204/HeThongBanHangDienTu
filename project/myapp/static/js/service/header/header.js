function fetchApiAuthenticated(){
    const url = '/api/authenticated/'
    return fetch(url)
        .then(response => {
           return response.json()
        })
}
export {fetchApiAuthenticated}