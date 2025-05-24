import { fetchApiCart, fetchApiRemoveCartItem, fetchApiUpdateQuantityCartItem } from '../service/cart/fetchApi.js';
import { fetchApiSetOrderProduct } from '../service/detail/fetchApi.js';
import { fetchApiTotalProduct } from  '../service/header/header.js'

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
    const checkboxes = document.querySelectorAll('.cartItem input[type="checkbox"]');
    const deleteSelectedBtn = document.querySelector('.delete-selected');
    const selectAllBtn = document.querySelector('.selectAll');
    const buyBtn = document.querySelector('.buy-btn');

    document.querySelectorAll('.increase-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const cartItem = e.target.closest('.cartItem');
            const index = Number(cartItem.dataset.stockIndex);
            const quantityEl = cartItem.querySelector('.quantity-value');
            const currentQuantity = parseInt(quantityEl.textContent);
            const maxStock = getStockData(index).stock;

            if (currentQuantity < maxStock) {
                setStockDataQuantity(index, currentQuantity + 1);
                quantityEl.textContent = currentQuantity + 1;
                updatePriceItem(index, currentQuantity + 1);
                if (cartItem.querySelector('input[type="checkbox"]').checked) updateTotalPrice();

                const product = {
                    "nameProduct": getStockData(index).nameProduct,
                    "version": getStockData(index).version,
                    "color": getStockData(index).color,
                    "quantity": currentQuantity + 1
                };
                fetchApiUpdateQuantityCartItem(product)
                    .then(data => console.log(data.detail));
            }
        });
    });

    document.querySelectorAll('.decrease-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
            const cartItem = e.target.closest('.cartItem');
            const index = Number(cartItem.dataset.stockIndex);
            const quantityEl = cartItem.querySelector('.quantity-value');
            const currentQuantity = parseInt(quantityEl.textContent);

            if (currentQuantity > 1) {
                setStockDataQuantity(index, currentQuantity - 1);
                quantityEl.textContent = currentQuantity - 1;
                updatePriceItem(index, currentQuantity - 1);
                if (cartItem.querySelector('input[type="checkbox"]').checked) updateTotalPrice();

                const product = {
                    "nameProduct": getStockData(index).nameProduct,
                    "version": getStockData(index).version,
                    "color": getStockData(index).color,
                    "quantity": currentQuantity - 1
                };
                fetchApiUpdateQuantityCartItem(product)
                    .then(data => console.log(data.detail));
            }
        });
    });

    checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', updateTotalPrice);
    });

    selectAllBtn.addEventListener('click', () => {
        const allChecked = [...checkboxes].every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allChecked);
        updateTotalPrice();
    });

    deleteSelectedBtn.addEventListener('click', () => {
        checkboxes.forEach((cb) => {
            if (cb.checked) {
                const cartItem = cb.closest('.cartItem');
                const index = Number(cartItem.dataset.stockIndex);
                deleteItem({ currentTarget: cartItem.querySelector('.delete') }, index);
            }
        });
    });

    buyBtn.addEventListener('click', () => {
        const orderInfo = getSelectedProduct();
        if (orderInfo.length > 0) {
            fetchApiSetOrderProduct(orderInfo)
                .then(() => window.location.href = "/info_order/");
        } else {
            console.log('Không có sản phẩm nào được chọn');
        }
    });
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
            fetchApiTotalProduct()
            .then(data => {
                const total = data.total_product || 0;
                const totalProduct= document.querySelector('.total-product');
                totalProduct && totalProduct.classList.add('active');
                totalProduct.innerHTML = total;
            })
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
        stock: item.product.options[0].colors[0].stock,
        price: item.product.options[0].colors[0].price,
        discount: item.product.options[0].discount,
        nameProduct: item.product.name,
        version: item.product.options[0].version,
        color: item.product.options[0].colors[0].color,
        slugProduct : item.product.slug,
        slugOption : item.product.options[0].slug,
        quantity: item.quantity
    }));

        const cartItemsHTML = data.map((item, index) => {
        const discount = item.product.options[0].discount ?? 0;
        const priceBase = item.product.options[0].colors[0].price;
        const stock = item.product.options[0].colors[0].stock;
        const quantity = item.quantity;
        const finalPrice = (priceBase - priceBase * discount) * quantity;

        return `
            <div class="cartItem" data-stock-index="${index}">
                <input type="checkbox" ${stock === 0 ? 'disabled' : ''}>
                <div class="product-container">
                    <img src="${item.product.options[0].colors[0].images[0].img}" alt="" />
                    <div class="product-details">
                        <p class="product-name">${item.product.name} - ${item.product.options[0].version} - ${item.product.options[0].colors[0].color}</p>
                        <div class="price-container">
                            ${stock === 0 ? '' : discount > 0 ?
                             `
                                <p class="product-price">${finalPrice.toLocaleString('vi-VN')}đ</p>
                                <p class="old-price" style="color:rgba(0, 0, 0, .5)"><strike>${Number(priceBase).toLocaleString('vi-VN')}đ</strike></p>
                             `
                             :
                              `<p class="product-price">${finalPrice.toLocaleString('vi-VN')}đ</p>`}
                            <div class="quantity">
                                ${
                                  stock === 0
                                  ? `<p class="out-of-stock">Hết hàng</p>`
                                  : `
                                    <button class="decrease-btn" data-index="${index}">-</button>
                                    <p class="quantity-value" data-index="${index}">${quantity}</p>
                                    <button class="increase-btn" data-index="${index}">+</button>
                                  `
                                }
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
        console.log(data.cart);
        if (data.cart.length < 1){
            loadCartEmpty();
        }else{
            loadCartItem(data.cart)
        }
    })