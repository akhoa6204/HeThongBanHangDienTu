import {fetchApiAuthenticated} from  '../service/header/header.js'
const input = document.querySelector('#header .search input');
const searchBtn = document.querySelector('#header .search label');
searchBtn.addEventListener('click', () =>{
    const keyword = input.value.trim();
    window.location.href = `/search/${keyword}/`;
})
input.addEventListener('keydown', (event)=>{
    if (event.key === 'Enter'){
        const keyword = input.value.trim();
        window.location.href = `/search/${keyword}/`;
    }
})
const box = document.querySelector('#header .box');
fetchApiAuthenticated()
    .then(data=>{
        if(data.is_authenticated){
            box.innerHTML += `
                <div class="user">
                    <span class="material-symbols-outlined">person</span>
                    <p>Tôi</p>
                    <div class='nav'>
                        <div class="subNav info">
                            <span class="material-symbols-outlined">manage_accounts</span>
                            <p>Thông tin người dùng</p>
                        </div>
                        <div class="subNav pass">
                            <span class="material-symbols-outlined">lock</span>
                            <p>Đổi mật khẩu</p>
                        </div>
                        <div class="subNav order">
                            <span class="material-symbols-outlined">inventory</span>
                            <p>Đơn mua</p>
                        </div>
                    </div>
                </div>
                <div class="logout">
                    <span class="material-symbols-outlined">logout</span>
                    <p>Đăng xuất</p>
                </div>
            `;
            const user = box.querySelector('.user');
            const nav = user.querySelector('.nav');
            const info = nav.querySelector('.info');
            const pass = nav.querySelector('.pass');
            const logout = box.querySelector('.logout');
            const order = box.querySelector('.order');
            logout.addEventListener('click', ()=>{
                window.location.href ='/logout/';
            });
             order.addEventListener('click', ()=>{
                window.location.href ='/purchase/';
            });
            nav.addEventListener('click', (e) => {
                e.stopPropagation();
            })
            info.addEventListener('click', () => {
                window.location.href = '/info_user/'
            })
            pass.addEventListener('click', () => {
                window.location.href = '/change_password/'
            })

        }else{
            box.innerHTML += `
                <a class="loginBox" href="/login/">
                    <span class="material-symbols-outlined">person</span>
                    <p>Đăng nhập</p>
                </a>
            `;
        }
    })
