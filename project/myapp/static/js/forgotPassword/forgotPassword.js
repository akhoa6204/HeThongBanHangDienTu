import {fetchApiCheckEmail} from '../service/forgotPassword/fetchApi.js';

const formContainer = document.querySelector('.form-container');
const email = document.querySelector('#email');
const cancelBtn = document.querySelector('.cancel');
cancelBtn.addEventListener('click', () =>{
    window.location.href = '/login/';
})
const span = document.querySelector('span.error-message');
formContainer.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailValue = email.value.trim();
    span.textContent ="";
    if(!emailValue){
        span.textContent= "Email không được để trống";
        return
    }
    console.log(emailValue);
    fetchApiCheckEmail(emailValue)
    .then(data => {
        window.location.href='/verify-code/';
    })
    .catch(error =>{
        span.textContent= "Email không tồn tại";
    })
})

