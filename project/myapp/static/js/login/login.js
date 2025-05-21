import { fetchApiLogin } from '../service/login/fetchApi.js';
const form = document.querySelector("form");
const name = document.querySelector('input[name="username"]');
const password = document.querySelector('input[name="password"]');

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const errorMessageAll = document.querySelectorAll('.error-message');
    errorMessageAll.forEach((errorMessage) => errorMessage.textContent = '');

    let p, message;

    if (!name.value.trim()) {
        message = 'Trường này không được để trống.';
        addMessage(name, message);
        return;
    }
    if (!password.value.trim()) {
        message = 'Trường này không được để trống.';
        addMessage(password, message);
        return;
    }

    const username= name.value;
    const passwordValue= password.value;
    fetchApiLogin(username, passwordValue)
    .then(data => {
        if (data.role === 'customer') {
            window.location.href = '/';
        } else if (data.role === 'admin') {
            window.location.href = '/products/';
        }
    })
    .catch(error => {
        addMessage(password, error.message);
    })
});

function addMessage(element, message) {
    const p = element.parentElement.querySelector('.error-message');
    p.textContent = message;
}
