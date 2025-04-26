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
                    <p>Anh Khoa</p>
                </div>
                <div class="logout">
                    <span class="material-symbols-outlined">logout</span>
                    <p>Đăng xuất</p>
                </div>
            `;
            const logout = box.querySelector('.logout');
            logout.addEventListener('click', ()=>{
                window.location.href ='/logout/';
            });
        }else{
            box.innerHTML += `
                <a class="loginBox" href="/login/">
                    <span class="material-symbols-outlined">person</span>
                    <p>Đăng nhập</p>
                </a>
            `;
        }
    })
