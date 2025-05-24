import {fetchApiOrders, fetchApiPatchOrderStatus} from '../service/admin_orders/fetchApi.js';

const searchInput = document.getElementById("searchInput");
const pagination = document.getElementById("pagination");
const orderStatusOrder = ["pending", "processing", "shipping", "shipped"];
const orderStatusMap = {
  pending: "Chờ xác nhận",
  processing: "Đang xử lí",
  shipping: "Đang giao hàng",
  shipped: "Đã giao hàng",
  cancelled: "Đã hủy"
};
let currentPage = 1;
let currentSearch = '';
function updateSelectOptions(select, currentStatus) {
    select.innerHTML = ''; // clear toàn bộ option cũ

    if (currentStatus === 'cancelled') {
        const option = new Option(orderStatusMap['cancelled'], 'cancelled');
        option.className = 'cancelled';
        option.selected = true;
        select.appendChild(option);
    } else {
        const currentOption = new Option(orderStatusMap[currentStatus], currentStatus);
        currentOption.className = currentStatus;
        currentOption.selected = true;
        select.appendChild(currentOption);

        const currentIndex = orderStatusOrder.indexOf(currentStatus);
        const nextStatus = orderStatusOrder[currentIndex + 1];
        if (nextStatus) {
            const nextOption = new Option(orderStatusMap[nextStatus], nextStatus);
            nextOption.className = nextStatus;
            select.appendChild(nextOption);
        }

        // ✅ Chỉ thêm option hủy nếu đang ở trạng thái "pending"
        if (currentStatus !== 'shipped' && currentStatus !== 'cancelled') {
            const cancelOption = new Option(orderStatusMap['cancelled'], 'cancelled');
            cancelOption.className = 'cancelled';
            select.appendChild(cancelOption);
        }
    }
}

function fetchApiOrder(page = 1, search = '') {
    return fetchApiOrders(page, search)
    .then(data => {
        console.log(data);
        loadData(data.orders);
        renderPagination(data.total_pages, data.current_page);
    })
    .catch(err => {
        alert(err.message);
    });
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    const h = String(date.getHours()).padStart(2, '0');
    const m = String(date.getMinutes()).padStart(2, '0');
    const s = String(date.getSeconds()).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${h}:${m}:${s} ${day}/${month}/${year}`;
}

function loadData(orders) {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = '';
    if (orders.length === 0) {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = 7; // Số cột trong bảng của bạn
        td.style.textAlign = 'center';
        td.textContent = 'Không có đơn hàng';
        tr.appendChild(td);
        tbody.appendChild(tr);
        return;
    }
    orders.forEach((order) => {
        const tr = document.createElement('tr');
        const select = document.createElement('select');
        select.name = "status";
        select.classList.add(order.status);

        if (order.status === 'cancelled') {
            const option = new Option(orderStatusMap['cancelled'], 'cancelled');
            option.className = 'cancelled'; // Gán class
            option.selected = true;
            select.appendChild(option);
        }
        else {
            const currentOption = new Option(orderStatusMap[order.status], order.status);
            currentOption.className = order.status;
            currentOption.selected = true;
            select.appendChild(currentOption);

            const currentIndex = orderStatusOrder.indexOf(order.status);
            const nextStatus = orderStatusOrder[currentIndex + 1];
            if (nextStatus) {
                const nextOption = new Option(orderStatusMap[nextStatus], nextStatus);
                nextOption.className = nextStatus;
                select.appendChild(nextOption);
            }
            if (order.status !== 'shipped') {
                const cancelOption = new Option(orderStatusMap['cancelled'], 'cancelled');
                cancelOption.className = 'cancelled';
                select.appendChild(cancelOption);
            }
        }
        tr.innerHTML = `
            <td>${order.id}</td>
            <td>${order.user.first_name} ${order.user.last_name}</td>
            <td>${order.user.phone}</td>
            <td>${order.user.email}</td>
            <td>${formatDateTime(order.created_at)}</td>
            <td class="status-cell"></td>
            <td><span class="detail" style='background-color:rgba(0, 142, 204, 0.37); color:rgba(44, 63, 132, 1); margin:0;'>Chi tiết</span></td>
        `;

        tr.querySelector('.status-cell').appendChild(select);
        tbody.appendChild(tr);
        const detailBtn = tr.querySelector('.detail');
        detailBtn.addEventListener('click', function () {
            window.location.href = `/quantri/orders/${order.id}`;
        });
        let previousStatus = select.value; // Lưu trạng thái ban đầu

        select.addEventListener('change', function () {
            const newStatus = select.value;

            if (select.options.length === 1 && newStatus === 'cancelled') {
                return;
            }

            if (newStatus !== previousStatus && newStatus === 'cancelled') {
                select.value = previousStatus;
                window.location.href = `/quantri/orders/${order.id}/?to=${newStatus}`;
                return;
            }

            // Các trường hợp hợp lệ khác: gọi API cập nhật trạng thái
            fetchApiPatchOrderStatus(order.id, newStatus)
                .then(data => {
                    console.log(data.detail);
                    select.className = '';
                    select.classList.add(newStatus);
                    updateSelectOptions(select, newStatus);

                    // Cập nhật lại previousStatus sau khi thành công
                    previousStatus = newStatus;
                })
                .catch(err => {
                    alert(err.message);
                    // Revert nếu lỗi
                    select.value = previousStatus;
                });
        });



    });
}


function createPageButton(page, currentPage) {
    const btn = document.createElement('p');
    btn.innerText = page;
    btn.className = page === currentPage ? 'active' : '';
    if (page !== currentPage) {
        btn.onclick = () => {
            currentPage = page;
            fetchApiOrder(currentPage, currentSearch);
        };
    }
    return btn;
}

function createDots() {
    const p = document.createElement('p');
    p.innerText = '...';
    p.className = 'dots';
    return p;
}

function renderPagination(totalPages, currentPage) {
    pagination.innerHTML = '';
    if (totalPages <= 1) return;

    // Nút mũi tên trái
    if (currentPage > 1) {
        const prev = document.createElement('p');
        prev.className = 'arrow-btn';
        prev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prev.onclick = () => {
            currentPage--;
            fetchApiOrder(currentPage, currentSearch);
        };
        pagination.appendChild(prev);
    }

    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, currentPage + 1);

    if (currentPage === 1) {
        end = Math.min(3, totalPages);
    }
    if (currentPage === totalPages) {
        start = Math.max(totalPages - 2, 1);
    }

    if (start > 1) {
        pagination.appendChild(createPageButton(1, currentPage));
        if (start > 2) pagination.appendChild(createDots());
    }

    for (let i = start; i <= end; i++) {
        pagination.appendChild(createPageButton(i, currentPage));
    }

    if (end < totalPages) {
        if (end < totalPages - 1) pagination.appendChild(createDots());
        pagination.appendChild(createPageButton(totalPages, currentPage));
    }

    // Nút mũi tên phải
    if (currentPage < totalPages) {
        const next = document.createElement('p');
        next.className = 'arrow-btn';
        next.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        next.onclick = () => {
            currentPage++;
            fetchApiOrder(currentPage, currentSearch);
        };
        pagination.appendChild(next);
    }
}

searchInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        fetchApiOrder(currentPage, currentSearch);
    }
});

searchInput.addEventListener('input', () => {
    if (searchInput.value.trim() === '') {
        currentSearch = '';
        currentPage = 1;
        fetchApiOrder(currentPage, currentSearch);
    }
});

fetchApiOrder(currentPage, currentSearch);
