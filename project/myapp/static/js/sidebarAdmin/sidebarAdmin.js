const path = window.location.pathname;
const current = path.split('/')[2];
const boxAll = document.querySelectorAll('.box');
if (current == 'product'){
    boxAll[0].classList.add('active');
}else if(current == 'order'){
    boxAll[1].classList.add('active');
}else if(current == 'review'){
    boxAll[2].classList.add('active');
}else{
    boxAll[3].classList.add('active');
}