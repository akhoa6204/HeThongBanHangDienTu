function fetchApiGet(page, star = null) {
    let url = `/api/reviews/?page=${page || 1}`;
    if (star !== null) {
        url += `&star=${star}`;
    }

    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'GET',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        });
}

function fetchApiUpdateReviewReply(id, content){
    const url = `/api/reviews/update/`;

    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({id, content})
            });
        })
        .then(async res => {
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        });
}
export {fetchApiGet,fetchApiUpdateReviewReply};