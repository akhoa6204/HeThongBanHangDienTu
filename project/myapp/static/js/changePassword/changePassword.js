import {fetchApiChangePassword} from '../service/changePassword/fetchApi.js';
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
    if (newPassword.value.trim() === currentPassword.value.trim()){
        addErrorMessage(newPassword, 'Mật khẩu mới phải khác mật khẩu hiện tại');
        return;
    }
     const passwordRegex = /^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$/;
    if (!passwordRegex.test(newPassword.value)) {
        addErrorMessage(newPassword, "Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ in hoa và 1 kí tự đặc biệt.");
        return;
    }



    const currentPasswordValue = currentPassword.value.trim();
    const newPasswordValue = newPassword.value.trim();

    fetchApiChangePassword(currentPasswordValue, newPasswordValue)
    .then(data => {
        const popupModel = document.querySelector('.popup-model');
        popupModel.classList.add('active');
        form.reset();
    })
    .catch(error => {
        addErrorMessage(currentPassword, error.message);
    })
});
function addErrorMessage(element, message){
    const p = element.parentElement.querySelector('.error-message');
    p.textContent= message;
}