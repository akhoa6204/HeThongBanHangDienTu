const form = document.querySelector('form');
const currentPassword = document.getElementById('currentPassword');
const newPassword = document.getElementById('newPassword');
const confirmNewPassword = document.getElementById('confirmNewPassword');
const columns = [currentPassword, newPassword, confirmNewPassword];
const errorMessageAll = document.querySelectorAll('.error-message');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorMessageAll.forEach(errorMessage => errorMessage.textContent = '');
    for(const column of columns){
        if(!column.value.trim()){
            addErrorMessage(column, 'Trường này không được để trống');
            return;
        }
    }
    if (newPassword.value.trim() !== confirmNewPassword.value.trim()){
        addErrorMessage(confirmNewPassword, 'Trường này phải trùng với mật khẩu mới');
        return;
    }
     const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(newPassword.value)) {
        addErrorMessage(newPassword, "Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ in hoa và 1 kí tự đặc biệt.");
        return;
    }

    const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const formData = new FormData();
    formData.append('currentPassword', currentPassword.value.trim());
    formData.append('newPassword', newPassword.value.trim());
    formData.append('csrfmiddlewaretoken', csrf);
    fetch('', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData,
    })
    .then(response => {
        if (response.ok) {
            return response.json();
        }else if (response.status === 400){
            return response.json();
        }else{
            throw new Error;
        }
    })
    .then(data => {
        if (data) {
            if (data?.message) {
                window.location.href = '/';
            } else if (data?.['error-message-password']) {
                addErrorMessage(currentPassword, data['error-message-password']);
            } else {
                console.error('Lỗi không xác định:', data);
            }
        } else {
            console.error('Dữ liệu trả về không hợp lệ:', data);
        }
    })
    .catch(err => {
        console.error('Lỗi:', err);
    });
});
function addErrorMessage(element, message){
    const p = element.parentElement.querySelector('.error-message');
    p.textContent= message;
}