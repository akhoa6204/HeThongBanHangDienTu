import { fetchApiCart, fetchApiRemoveCartItem, fetchApiUpdateQuantityCartItem } from '../service/cart/fetchApi.js';

const main = document.querySelector('main');
let stockData = [];
function getStockData(indexProduct){
    const product = stockData.find((item, index) => index === indexProduct);
    return product;
}
function setStockDataQuantity(index, value){
    stockData[index].quantity = value ;
}
function loadHeader(){
    main.innerHTML = `
        <section class="cart-header">
            <span class="back-icon"><a href ='/'>←</a></span>
            <h2>Giỏ hàng của bạn</h2>
        </section>
    `;
}
function updateTotalPrice() {
    const cartSummary = document.querySelector('.cart-summary');
    const summaryPrice = cartSummary.querySelector('.summary-price');
    const buyBtn = cartSummary.querySelector('.buy-btn');

    let total = 0;

    const cartItems = document.querySelectorAll('.cartItem');
    cartItems.forEach((parentElement) => {
        const checkbox = parentElement.querySelector('input[type=checkbox]');
        const priceElement = parentElement.querySelector('.product-price');

        if (checkbox && checkbox.checked) {
            const productPrice = Number(priceElement.textContent.replace(/[^\d]/g, ''));
            total += productPrice;
        }
    });

    summaryPrice.textContent = total.toLocaleString('vi-VN') + 'đ';
}
function getSelectedProduct() {
    const productList = [];
    const cartItems = document.querySelectorAll('.cartItem');
    cartItems.forEach((parentElement, index) => {
        const checkbox = parentElement.querySelector('input[type=checkbox]');
        if (checkbox && checkbox.checked) {
            productList.push({
                slugProduct: getStockData(index).slugProduct,
                slugOption: getStockData(index).slugOption,
                color: getStockData(index).color,
                quantity: getStockData(index).quantity,
            });
        }
    });

    return productList;
}

function updatePriceItem(index, quantity){
    const cartItem = document.querySelectorAll('.cartItem')[index];
    const productPrice = cartItem.querySelector('.product-price');
    const originalPrice = cartItem.querySelector('.original-price');
    const item = getStockData(index);
    const discount = item.discount ?? 0;
    const finalPrice = (item.price - item.price * discount) * quantity;
    productPrice.textContent = `${finalPrice.toLocaleString('vi-VN')}đ`;
    if(discount > 0){
        originalPrice.textContent = `${discount ? `${item.option.price.toLocaleString('vi-VN')}đ` : ''}`;
    }
}
function attachCartEventHandlers() {
    const increaseBtns = document.querySelectorAll('.increase-btn');
    const decreaseBtns = document.querySelectorAll('.decrease-btn');
    const quantityEls = document.querySelectorAll('.quantity-value');
    const checkboxes = document.querySelectorAll('.cartItem input[type="checkbox"]');
    const deleteSelectedBtn = document.querySelector('.delete-selected');
    const selectAllBtn = document.querySelector('.selectAll');
    const buyBtn = document.querySelector('.buy-btn');

    increaseBtns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            const quantityEl = quantityEls[i];
            const currentQuantity = parseInt(quantityEl.textContent);
            const maxStock = getStockData(i).stock;
            if (currentQuantity < maxStock) {
                setStockDataQuantity(i, currentQuantity + 1)
                quantityEl.textContent = currentQuantity + 1;
                updatePriceItem(i, currentQuantity + 1 )
                if (checkboxes[i].checked) updateTotalPrice();
                const product = {
                    "nameProduct": getStockData(i).nameProduct,
                    "version": getStockData(i).version,
                    "color": getStockData(i).color,
                    "quantity" : currentQuantity + 1
                };
                fetchApiUpdateQuantityCartItem(product)
                .then(data => {
                    console.log(data.detail);
                })
            }
        });
    });

    decreaseBtns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
            const quantityEl = quantityEls[i];
            const currentQuantity = parseInt(quantityEl.textContent);
            if (currentQuantity > 1) {
                setStockDataQuantity(i, currentQuantity - 1)
                quantityEl.textContent = currentQuantity - 1;
                updatePriceItem(i, currentQuantity - 1 )
                if (checkboxes[i].checked) updateTotalPrice();
                const product = {
                    "nameProduct": getStockData(i).nameProduct,
                    "version": getStockData(i).version,
                    "color": getStockData(i).color,
                    "quantity" : currentQuantity - 1
                };
                fetchApiUpdateQuantityCartItem(product)
                .then(data => {
                    console.log(data.detail);
                })
            }
        });
    });

    checkboxes.forEach((checkbox, i) => {
        checkbox.addEventListener('change', (e) => {
            updateTotalPrice();
        });
    });

    selectAllBtn.addEventListener('click', () => {
        const allChecked = [...checkboxes].every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        checkboxes.forEach((cb, i) => updateTotalPrice());
    });

    deleteSelectedBtn.addEventListener('click', () => {
        checkboxes.forEach((cb, i) => {
            if (cb.checked) {
                const deleteBtn = document.querySelectorAll('.delete')[i];
                deleteBtn.click();
            }
        });
    });

    buyBtn.addEventListener('click', () => {
        console.log('click mua hàng')
        const orderInfo = getSelectedProduct();
        if(orderInfo.length > 0){
            localStorage.setItem('orderInfo', JSON.stringify(orderInfo));
            window.location.href = "/info_order/";
        }else{
            console.log('Không có sản phẩm nào được chọn')
        }
    })
}


function deleteItem(e, index) {
    const event = e.currentTarget;
    const parentElement = event.closest('.cartItem');

   const productList = [{
    "nameProduct": getStockData(index).nameProduct,
    "version": getStockData(index).version,
    "color": getStockData(index).color,
   }]
   fetchApiRemoveCartItem(productList)
    .then(data => {
        if (data.detail === 'Xóa sản phẩm thành công'){
            console.log(data.detail);
            parentElement.remove();
            const cartItem = document.querySelectorAll('.cartItem');
            if (cartItem.length < 1){
                loadCartEmpty();
            }

        }
    })
}

window.updateTotalPrice = updateTotalPrice;
window.deleteItem = deleteItem;

function loadCartEmpty(){
    loadHeader();
    main.innerHTML += `
        <section class="cartEmpty">
            <img src="${staticUrl}" alt="">
            <p>
                <strong>
                    Giỏ hàng của bạn đang trống.<br/>Hãy chọn thêm sản phẩm để mua sắm nhé
                </strong>
            </p>
            <a href="/">
                <button><span>Quay lại trang chủ</span></button>
            </a>
        </section>
    `;
}
function loadCartItem(data) {
    stockData = data.map((item, index) => ({
        index: index,
        stock: item.option.quantity,
        price: item.option.price,
        discount: item.option.discount,
        nameProduct: item.option.product.name,
        version: item.option.version,
        color: item.option.color,
        slugProduct : item.option.product.slug,
        slugOption : item.option.slug,
        quantity: item.quantity
    }));

    const cartItemsHTML = data.map((item, index) => {
        const discount = item.option.discount ?? 0;
        const finalPrice = (item.option.price - item.option.price * discount) * item.quantity;
        return `
            <div class="cartItem">
                <input type="checkbox">
                <div class="product-container">
                    <img src="${item.option.img[0]}" alt="" />
                    <div class="product-details">
                        <p class="product-name">${item.option.product.name} -\n${item.option.version} - ${item.option.color}</p>
                        <div class="price-container">
                            <p class="product-price">${finalPrice.toLocaleString('vi-VN')}đ</p>
                            ${discount ? `<p class="original-price">${item.option.price.toLocaleString('vi-VN')}đ</p>` : ''}
                            <div class="quantity">
                                <button class="decrease-btn" data-index="${index}">-</button>
                                <p class="quantity-value" data-index="${index}">${item.quantity}</p>
                                <button class="increase-btn" data-index="${index}">+</button>
                            </div>
                        </div>
                    </div>
                    <i class="material-symbols-outlined delete" onclick="deleteItem(event, ${index})">delete</i>
                </div>
            </div>
        `;
    }).join('');

    const html = `
        <section class="cartMain">
            <section class="cart-options">
                <div class="selectAll">
                    <p>Chọn tất cả</p>
                </div>
                <a href="#" class="delete-selected">Xóa sản phẩm đã chọn</a>
            </section>
            <section class="cartItemBox">
                ${cartItemsHTML}
            </section>
        </section>
        <section class="cart-summary">
            <div>
                <p>Tạm tính: <span class="summary-price">0đ</span></p>
                <p class="note">Chưa gồm chiết khấu</p>
            </div>
            <button class="buy-btn">Mua ngay</button>
        </section>
    `;
    loadHeader();
    main.innerHTML += html;

    attachCartEventHandlers();
}
fetchApiCart()
    .then(data => {
        console.log(data);
        if (data.cart.length < 1){
            loadCartEmpty();
        }else{
            loadCartItem(data.cart)
        }
    })