function fetchApiResetPassword(newPassword){
    const url = '/api/resetPassword/';
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookie.value
                },
                credentials: 'include',
                body: JSON.stringify({newPassword})
            })
            .then(async response => {
                const data = await response.json()
                if (!response.ok){
                    throw new Error(data.detail || "Có lỗi xảy ra");
                }
                return data;
            })
        })
}
export {fetchApiResetPassword};