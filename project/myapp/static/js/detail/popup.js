const popupModelAll = document.querySelectorAll('.popup-model');
console.log(popupModelAll);
popupModelAll.forEach(popupModel => {
    const popup = popupModel.querySelector('.popUp-container');
    const btnClose = popup.querySelector('.btnClosePopup');
    const btnBack  = popup.querySelector('.back');
    popup.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    popupModel.addEventListener('click', ()=>{
        popupModel.classList.remove('active');
    })
    if (btnClose){
        btnClose.addEventListener('click', ()=>{
            popupModel.classList.remove('active');
        })
    }
    if (btnBack){
        btnBack.addEventListener('click', ()=>{
            popupModel.classList.remove('active');
        })
    }
})
