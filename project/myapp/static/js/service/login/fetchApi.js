function fetchApiLogin(username, password){
    const url = '/api/login/';
    return  cookieStore.get('csrftoken')
    .then(cookie => {
        return fetch(url, {
            method : 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': cookie.value,
            },
            credentials: 'include',
            body: JSON.stringify({username, password})
        })
    })
    .then(async response =>{
        const data = await response.json();
        if(!response.ok){
            throw new Error(data.detail || "Có lỗi xảy ra")
        }
        return data;
    })
}
export {fetchApiLogin};