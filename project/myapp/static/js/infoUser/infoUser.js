import { fetchApiInfoUser, fetchApiUpdate } from '../service/infoUser/fetchApi.js';
const main = document.querySelector('main');
let originalInfo = {};
function checkChanges() {
    const inputs = document.querySelectorAll('input, select');
    const submitButton = document.querySelector('input[type="submit"]');
    let hasChanges = false;

    inputs.forEach(input => {
        const fieldName = input.id;
        if (input.value.trim() !== originalInfo[fieldName]) {
            hasChanges = true;
        }
    });

    submitButton.disabled = !hasChanges;
}
function loadData(data){
    const sex = data.sex === 'male' || data.sex === 'Nam' ? 'Nam' : data.sex === 'female' || data.sex === 'Nữ' ? 'Nữ' : 'Khác';
    const html = `
         <form class="form-user">
            <h2>Thông tin người dùng</h2>
            <div class="input-group">
                <div class="info-row">
                    <label for="last_name">Họ</label>
                    <span class="value">${data.lastName}</span>
                    <input type="text" placeholder="${data.lastName}" id="last_name" value="${data.lastName}" disabled>
                    <span class="edit-icon">✎</span>
                </div>
                <span class="error-message"></span>
            </div>
            <div class="input-group">
                <div class="info-row">
                    <label for="first_name">Tên</label>
                    <span class="value">${data.firstName}</span>
                    <input type="text" placeholder="${data.firstName}" id="first_name" value="${data.firstName}" disabled>
                    <span class="edit-icon">✎</span>
                </div>
                <span class="error-message"></span>
            </div>
            <div class="input-group">
                <div class="info-row">
                    <label for="sex">Giới tính</label>
                    <span class="value">${sex}</span>
                    <select name="" id="sex" disabled>
                        <option value="Nam" ${data.sex === 'male' ? 'selected' : ''}>Nam</option>
                        <option value="Nữ" ${data.sex === 'female' ? 'selected' : ''}>Nữ</option>
                        <option value="Khác" ${data.sex === 'other' ? 'selected' : ''}>Khác</option>
                    </select>
                    <span class="edit-icon">✎</span>
                </div>
                <span class="error-message"></span>
            </div>
            <div class="input-group">
                <div class="info-row">
                    <label>Số điện thoại</label>
                    <span class="value">${data.phone}</span>
                </div>
                <span class="error-message"></span>
            </div>
            <div class="input-group">
                <div class="info-row">
                    <label for="birthday">Sinh nhật</label>
                    <span class="value">${data.birthday ? data.birthday : "Chưa cập nhật"}</span>
                    <input type="date" value="${data.birthday}" placeholder="${data.birthday ? data.birthday : 'Chưa cập nhật'}" id="birthday" disabled>
                    <span class="edit-icon">✎</span>
                </div>
                <span class="error-message"></span>
            </div>
            <div class="input-group">
                <div class="info-row">
                    <label for="address">Địa chỉ</label>
                    <span class="value">${data.address ? data.address : "Chưa cập nhật"}</span>
                    <input type="text" value="${data.address ? data.address : "Chưa cập nhật"}" placeholder="${data.address ? data.address : "Chưa cập nhật"}" id="address" disabled>
                    <span class="edit-icon">✎</span>
                </div>
                <span class="error-message"></span>
            </div>
            <div class="input-group">
                <input type="submit" value="Cập nhật thông tin" class="update-btn" disabled>
            </div>
        </form>
    `;
    main.innerHTML = html;
}
function setUpEventListener(){
    const editIconAll = document.querySelectorAll('.edit-icon');
    const form = document.querySelector('form');
    editIconAll.forEach(editIcon => {
        editIcon.addEventListener('click', () =>{
            const inputGroup = editIcon.parentElement;
            const input = inputGroup.querySelector('input, select');
            const spanValue = inputGroup.querySelector('.value');

            input.disabled = !input.disabled;
            input.classList.toggle('active');
            spanValue.classList.toggle('hidden');
            spanValue.textContent = input.value || input.placeholder;
            checkChanges();
        })
    })
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        let dataChange = {};
        const editIconAll = document.querySelectorAll('.edit-icon');

        editIconAll.forEach(editIcon => {
            const inputGroup = editIcon.parentElement;
            const spanValue = inputGroup.querySelector('.value');
            const input = inputGroup.querySelector('input, select');
            if (input.classList.contains('active')){
                editIcon.click();
            }
            const fieldName = input.id;
            dataChange[fieldName] = spanValue.textContent.trim();
        })
        let hasDifference = false;
        for (let key in dataChange) {
            let newValue = dataChange[key];

            if (key === 'birthday' && newValue === "Chưa cập nhật") {
                newValue = "";
            }
            if (key === 'sex'){
                newValue = newValue === 'Nam' ? 'male' : newValue === 'Nữ' ? 'female' : 'other';
            }
            const originalValue = originalInfo[key] ?? "";

            if (newValue !== originalValue) {
                console.log(newValue);
                console.log(originalValue);
                hasDifference = true;
                break;
            }
        }
        if (hasDifference) {
            console.log("Có thay đổi, gửi dữ liệu:", dataChange);
            fetchApiUpdate(dataChange)
            .then(data => {
                if (data){
                    const popupModel = document.querySelector('.popup-model');
                    popupModel.classList.add('active');
                }else{
                    alert("Dữ liêụ cập nhật thất bại");
                }
            })
        }
    })
}
fetchApiInfoUser()
.then(data => {
    originalInfo ={
        "first_name": data.user.firstName,
        'last_name': data.user.lastName,
        'address': data.user.address,
        'birthday': data.user.birthday,
        'sex': data.user.sex
    };
    loadData(data.user);
    setUpEventListener();
})