import { fetchApiGet } from '../service/admin_order_detail/fetchApi.js';

const pathParts = window.location.pathname.split('/');
const orderId = pathParts[3];
console.log("Order ID:", orderId);

function formatPrice(value) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

function renderCustomerInfo(user, order) {
  const container = document.getElementById('customer-info');
  if (!container) return;
  console.log(order);
  container.innerHTML = `
    <p><span class="material-symbols-outlined">person</span><strong>${user.first_name} ${user.last_name}</strong></p>
    <p>📞 ${user.phone}</p>
    <p>📧 ${user.email}</p>
    <p>🏠 ${order.address}</p>
    <p>🆔 Mã đơn hàng: <strong>${order.id}</strong></p>
    ${order.need_invoice ? '<p class="invoice-request">🧾 Khách hàng yêu cầu xuất hóa đơn</p>' : ''}
  `;
}

function renderOrderItems(order_items) {
  const container = document.getElementById('order-items');
  if (!container) return;

  if (!order_items.length) {
    container.innerHTML = '<p>Không có sản phẩm trong đơn hàng.</p>';
    return;
  }

  let html = `
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Ảnh</th>
          <th>Tên sản phẩm</th>
          <th>Đơn giá</th>
          <th>Số lượng</th>
          <th>Thành tiền</th>
        </tr>
      </thead>
      <tbody>
  `;

  order_items.forEach(item => {
    console.log(item);
    const product = item.product || {};
    const images = product.options[0].colors[0].images[0] || [];
    const imageUrl = images ? images.img : '';

    const productName = product.name || 'N/A';
    console.log(product);
    const discount = Number(product.options[0].discount) || 0;
    const oldPrice = Number(product.options[0].colors[0].price);
    const price = Number(product.options[0].colors[0].price) * (1-discount)| 0;

    const quantity = item.quantity || 0;

    // Thành tiền
    const total = price * quantity;

    html += `
      <tr>
        <td>${item.id}</td>
        <td><img src="${imageUrl}" alt="${productName}" style="max-width: 50px;"></td>
        <td>${productName} - ${product.options[0].version} - ${product.options[0].colors[0].color}</td>
        <td>
            ${discount > 0 ?
                `
                    <span style="color: red;font-size: 14px;">${formatPrice(price)}</span>
                    <span style="color:#ccc;"><strike>${formatPrice(oldPrice)}</strike></span>
                `:
                `<span style="color: red;font-size: 14px;">${formatPrice(price)}</span>`
            }
        </td>
        <td>${quantity}</td>
        <td><span style="color: red;font-size: 14px;">${formatPrice(total)}</span></td>
      </tr>
    `;
  });

  html += `
      </tbody>
    </table>
  `;

  container.innerHTML = html;
}

function renderTotalPrice(totalPrice) {
  const container = document.getElementById('total-price');
  if (!container) return;

  container.innerHTML = `<strong>Thành tiền:</strong> ${formatPrice(totalPrice)}`;
}

fetchApiGet(orderId)
  .then(data => {
    console.log('Order data:', data);
    if (!data) return;

    renderCustomerInfo(data.order.user, data.order);
    renderOrderItems(data.order.order_items);
    renderTotalPrice(data.order.total_price);
  })
  .catch(err => {
    console.error('Error fetching order:', err);
  });
