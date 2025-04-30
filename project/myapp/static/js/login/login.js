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

    const csrf = document.querySelector('[name=csrfmiddlewaretoken]').value;
    const formData = new FormData();
    formData.append('username', name.value);
    formData.append('password', password.value);
    formData.append('csrfmiddlewaretoken', csrf);

    fetch('', {
        method: 'POST',
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: formData,
    })
    .then(response => {
        if (!response.ok) {
            throw new Error("Login failed");
        }
        return response.json();
    })
    .then(data => {
        console.log(data.role);
        if (data.role === 'customer') {
            window.location.href = '/';
        } else if (data.role === 'admin') {
            window.location.href = '/admin_dashboard/';
        }
    })
    .catch(err => {
        addMessage(password, 'Tên đăng nhập hoặc mật khẩu không đúng.');
        console.error('Lỗi:', err);
    });
});

function addMessage(element, message) {
    const p = element.parentElement.querySelector('.error-message');
    p.textContent = message;
}
