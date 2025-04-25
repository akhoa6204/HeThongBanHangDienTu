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