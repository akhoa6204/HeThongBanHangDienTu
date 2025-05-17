import {fetchApiResetPassword} from '../service/resetPassword/fetchApi.js';
const formContainer = document.querySelector('.form-container');
const spanAll = document.querySelectorAll('span.error-message');
const inputAll = formContainer.querySelectorAll('input');
const password = document.querySelector('#newPassword');
const confirmPassword = document.querySelector('#confirmPassword');
formContainer.addEventListener('submit', (event) => {
    event.preventDefault();

    let hasError = false;
    spanAll.forEach(span => {
        span.textContent = '';
    });
    for (const input of inputAll) {
        if (!input.value.trim()) {
            const span = input.parentElement.querySelector('span.error-message');
            if (span) span.textContent = 'Trường này không được để trống';
            hasError = true;
            break;
        }
    }
    if (hasError) return;
    const passwordValue = password.value;
    const confirmPasswordValue = confirmPassword.value;
     const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(passwordValue)) {
        const span = password.parentElement.querySelector('span.error-message');
        if (span) span.textContent = 'Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ in hoa và 1 kí tự đặc biệt.';
        hasError = true;
        return;
    }
    if (passwordValue !== confirmPasswordValue) {
        const span = confirmPassword.parentElement.querySelector('span.error-message');
        if (span) span.textContent = 'Mật khẩu nhập lại không khớp';
        hasError = true;
    }

    if (!hasError) {
        fetchApiResetPassword(passwordValue)
        .then(data => {
            const popupSuccess = document.querySelector('.popup-model.success');
            popupSuccess.classList.add('active');
            popupSuccess.addEventListener('click', ()=>{
                window.location.href = '/login/';
            })
        })
        .catch(error => {
            const popupError = document.querySelector('.popup-model.error');
            popupError.classList.add('active');
            popupError.addEventListener('click', ()=>{
                window.location.href = '/login/';
            })
        })
    }
});
