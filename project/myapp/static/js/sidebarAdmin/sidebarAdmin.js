const path = window.location.pathname;
const current = path.split('/')[1];
const boxAll = document.querySelectorAll('.box');
if (current == 'products'){
    boxAll[0].classList.add('active');
}else if(current == 'orders'){
    boxAll[1].classList.add('active');
}else if(current == 'reviews'){
    boxAll[2].classList.add('active');
}