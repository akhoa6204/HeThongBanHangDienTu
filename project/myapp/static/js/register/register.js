const form = document.querySelector('.register-form');
const firstName = document.getElementById('first_name');
const lastName = document.getElementById('last_name');
const phone = document.getElementById('phone');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');
const columns = [firstName, lastName, phone, email, password, confirmPassword];
const errorMessageAll = document.querySelectorAll('.error-message');
form.addEventListener('submit', (e) =>{
    e.preventDefault();
    errorMessageAll.forEach(errorMessage => errorMessage.textContent ='');
    for (const column of columns) {
        if (!column.value.trim()) {
            const message = "Trường này không được bỏ trống";
            addErrorMessage(column, message);
            return;
        }
    }
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone.value.trim())) {
        addErrorMessage(phone, "Số điện thoại phải gồm đúng 10 chữ số.");
        return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(password.value)) {
        addErrorMessage(password, "Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ in hoa và 1 kí tự đặc biệt.");
        return;
    }
    if (password.value !== confirmPassword.value.trim()){
        addErrorMessage(confirmPassword, 'Trường này phải trùng với mật khẩu');
        return;
    }

    const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const formData = new FormData();
    formData.append('firstName', firstName.value.trim());
    formData.append('lastName', lastName.value.trim());
    formData.append('phone', phone.value.trim());
    formData.append('email', email.value.trim());
    formData.append('password', password.value.trim());
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
            if (data['error-message-email']) {
                addErrorMessage(email, data['error-message-email']);
            }
            if(data.message) {
                window.location.href='/login/';
            }
        } else {
            console.error('Dữ liệu trả về không hợp lệ:', data);
        }
    })
    .catch(err => {
        console.error('Lỗi:', err);
    });
})
function addErrorMessage(element, message){
    const p = element.parentElement.querySelector('.error-message');
    p.textContent= message;
}