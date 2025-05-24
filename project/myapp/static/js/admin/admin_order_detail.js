import { fetchApiGet, fetchApiCancelOrder } from '../service/admin_order_detail/fetchApi.js';

const pathParts = window.location.pathname.split('/');
const orderId = pathParts[3];
console.log("Order ID:", orderId);
const statusTextMap = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipping: 'Đang giao hàng',
  shipped: 'Đã giao hàng',
  cancelled: 'Đã hủy'
};

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
    if (!data) return;

    const order = data.order;
    renderCustomerInfo(order.user, order);
    renderOrderItems(order.order_items);
    renderTotalPrice(order.total_price);

    setupCancelForm(order);

    const statusSpan = document.querySelector('.orderStatus');
    if (statusSpan) {
      const statusClass = order.status;
      const statusText = statusTextMap[statusClass] || statusClass;

      statusSpan.textContent = statusText;
      statusSpan.className = 'orderStatus ' + statusClass;  // để thêm style theo class
    }

  })
  .catch(err => {
    console.error('Error fetching order:', err);
  });

function setupCancelForm(order) {
  const form = document.getElementById('form-cancelled');
  const reasonInput = document.getElementById('reason');
  const noteInput = document.getElementById('note');
  const cancelBtn = document.getElementById('cancelBtn');
  const saveBtn = document.getElementById('saveBtn');
  const backBtn = document.getElementById('backBtn');

  const urlParams = new URLSearchParams(window.location.search);
  const toStatus = urlParams.get('to');

  const isForceCancelMode = toStatus === 'cancelled';
  if (order.status === 'shipped') {
      // Đơn đã hoàn tất - không cho hủy
      form.style.display = 'none';
      cancelBtn.style.display = 'none';
      saveBtn.style.display = 'none';
      backBtn.style.display = 'none';
      return;
    }

  if (order.status === 'cancelled') {
    // Đơn đã bị hủy
    form.style.display = 'block';
    reasonInput.value = order.order_cancellation.reason || '';
    noteInput.value = order.order_cancellation.note || '';
    reasonInput.readOnly = true;
    noteInput.readOnly = true;

    cancelBtn.style.display = 'none';
    saveBtn.style.display = 'none';
    backBtn.style.display = 'none';
  } else if (isForceCancelMode) {
    // Trường hợp URL có ?to=cancelled => hiện form sẵn
    form.style.display = 'block';
    reasonInput.readOnly = false;
    noteInput.readOnly = false;

    cancelBtn.style.display = 'none';
    saveBtn.style.display = 'inline-block';
    backBtn.style.display = 'inline-block';
  } else {
    // Trạng thái bình thường
    form.style.display = 'none';
    cancelBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
    backBtn.style.display = 'none';

    cancelBtn.addEventListener('click', () => {
      form.style.display = 'block';
      reasonInput.readOnly = false;
      noteInput.readOnly = false;

      cancelBtn.style.display = 'none';
      saveBtn.style.display = 'inline-block';
      backBtn.style.display = 'inline-block';
    });

    backBtn.addEventListener('click', () => {
      form.style.display = 'none';
      reasonInput.value = '';
      noteInput.value = '';

      cancelBtn.style.display = 'inline-block';
      saveBtn.style.display = 'none';
      backBtn.style.display = 'none';
    });
  }

  // Xử lý khi nhấn "Lưu"
  saveBtn.addEventListener('click', () => {
    const cancelReason = reasonInput.value.trim();
    const note = noteInput.value.trim();

    if (!cancelReason) {
      alert('Vui lòng nhập lý do hủy.');
      return;
    }
    console.log(cancelReason);
    console.log(note);
    fetchApiCancelOrder(orderId, cancelReason, note)
    .then(data => {
    // Hiển thị popup thành công
    const popupSuccess = document.querySelector(".popup-model.success.change_status_order");
    popupSuccess.classList.add('active');

    // Cập nhật trạng thái trong DOM
    const statusSpan = document.querySelector('.orderStatus');
    if (statusSpan) {
        const statusText = statusTextMap['cancelled'];
        statusSpan.textContent = statusText;
        statusSpan.className = 'orderStatus cancelled';
    }

    // Cập nhật form: readonly và điền lại thông tin vừa gửi
    reasonInput.value = cancelReason;
    noteInput.value = note;
    reasonInput.readOnly = true;
    noteInput.readOnly = true;

    // Hiển thị form readonly
    form.style.display = 'block';
    cancelBtn.style.display = 'none';
    saveBtn.style.display = 'none';
    backBtn.style.display = 'none';
})

    .catch(err => {
        const popupError= document.querySelector(".popup-model.error.change_status_order");
        popupError.classList.add('active');
    })
  });
}
