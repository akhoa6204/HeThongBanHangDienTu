import { fetchApiRegister } from "../service/register/fetchApi.js";
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

    const firstNameValue = firstName.value.trim();
    const lastNameValue = lastName.value.trim();
    const phoneValue = phone.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();

    fetchApiRegister(firstNameValue, lastNameValue, phoneValue, emailValue, passwordValue)
    .then(data => {
        if(data){
            window.location.href='/login/';
        }
    })
    .catch(error => {
        addErrorMessage(email, error.message);
    })
})
function addErrorMessage(element, message){
    const p = element.parentElement.querySelector('.error-message');
    p.textContent= message;
}