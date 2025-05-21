function fetchApiOrders(page, search){
  const validPage = (typeof page === 'number' && page > 0) ? page : 1;
  const validSearch = (typeof search === 'string' && search.trim() !== '') ? search.trim() : '';

  let url = `/api/orders/?page=${validPage}`;
  if(validSearch){
    url += `&search=${encodeURIComponent(validSearch)}`;
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
            if(!res.ok){
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        })
}

function fetchApiPatchOrderStatus(orderId, status){
    const url = `/api/orders/patch/`;
    return cookieStore.get('csrftoken')
        .then(cookie => {
            return fetch(url, {
                method: 'PATCH',
                headers: {
                    'X-CSRFToken': cookie ? cookie.value : '',
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ orderId, status }),
            });
        })
        .then(async res => {
            const data = await res.json();
            if(!res.ok){
                throw new Error(data.detail || "Có lỗi xảy ra");
            }
            return data;
        });
}
export {fetchApiOrders, fetchApiPatchOrderStatus};