function fetchApiInfoUser(){
    const url = `/api/info_user/get/`;
    return cookieStore.get('csrftoken')
        .then(cookie =>
            fetch(url,{
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookie.value,
                },
                credentials: 'include',
            })
        )
        .then(response => {
            if(response.ok){
                return response.json()
            }
        })
}
function fetchApiUpdate(dataChange){
    const url = `/api/infoUser/patch/`;
    return cookieStore.get('csrftoken')
        .then(cookie =>
            fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookie.value,
                },
                credentials: 'include',
                body: JSON.stringify(dataChange)
            })
        )
        .then(response  => {
            if(response.ok){
                return response.json();
            }else{
                throw new Error;
            }
        })
        .catch(error => {
            console.error('Lỗi:', error);
        })
}
export {fetchApiInfoUser, fetchApiUpdate};