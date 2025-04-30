const popupModel = document.querySelector('.popup-model');
const popup = popupModel.querySelector('.popUp-container');
const btnClose = popup.querySelector('.btnClosePopup');
popup.addEventListener('click', (e) => {
    e.stopPropagation();
});
popupModel.addEventListener('click', ()=>{
    window.location.href='/purchase/';
})
btnClose.addEventListener('click', ()=>{
    window.location.href='/purchase/';
})