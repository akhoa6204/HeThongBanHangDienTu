function fetchApiCheckOtp(otp){
    const url = '/api/checkOTP/';
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookie.value
                },
                credentials: 'include',
                body: JSON.stringify({otp})
            })
            .then(async response => {
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.detail || "Có lỗi xảy ra");
                }
                return data;
            });
        })
}
function fetchApiGenerateOtp(){
    const url = '/api/generateOTP/';
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': cookie.value
                },
                credentials: 'include',
            })
            .then(async response => {
                const data = await response.json();
                if (!response.ok){
                    throw new Error(data.detail || "Có lỗi xảy ra");
                }
                return data;
            })
        })
}
export {fetchApiCheckOtp, fetchApiGenerateOtp};