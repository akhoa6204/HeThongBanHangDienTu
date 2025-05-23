import {fetchApiGet,fetchApiUpdateReviewReply} from '../service/admin_review/fetchApi.js';
const pagination = document.getElementById('pagination');
let currentStarFilter = null;
let currentPage = 1;

function createDots() {
  const p = document.createElement('p');
  p.innerText = '...';
  p.className = 'dots';
  return p;
}
function createPageButton(page) {
    const btn = document.createElement('p');
    btn.innerText = page;
    if (page === currentPage) {
      btn.className = 'active';
    } else {
      btn.onclick = () => {
        fetchApiReview(page, currentStarFilter);
      };
    }
    return btn;
}
function renderPagination(totalPage, currentPage) {
  pagination.innerHTML = '';
  if (totalPage <= 1) return;

  if (currentPage > 1) {
    const chevronLeft = document.createElement('p');
    chevronLeft.className = 'arrow-btn';
    chevronLeft.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
    chevronLeft.onclick = () => {
      fetchApiReview(currentPage - 1, currentStarFilter);
    };
    pagination.appendChild(chevronLeft);
  }

  let start = Math.max(1, currentPage - 1);
  let end = Math.min(totalPage, currentPage + 1);
  if (currentPage === 1) end = Math.min(3, totalPage);
  if (currentPage === totalPage) start = Math.max(totalPage - 2, 1);

  if (start > 1) {
    pagination.appendChild(createPageButton(1));
    if (start > 2) pagination.appendChild(createDots());
  }

  for (let i = start; i <= end; i++) {
    pagination.appendChild(createPageButton(i));
  }

  if (end < totalPage) {
    if (end < totalPage - 1) pagination.appendChild(createDots());
    pagination.appendChild(createPageButton(totalPage));
  }

  if (currentPage < totalPage) {
    const chevronRight = document.createElement('p');
    chevronRight.className = 'arrow-btn';
    chevronRight.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
    chevronRight.onclick = () => {
      fetchApiReview(currentPage + 1, currentStarFilter);
    };
    pagination.appendChild(chevronRight);
  }
}


function createReviewBox(review) {
    const fullName = `${review.user.first_name} ${review.user.last_name}`;
    const orderCode = `${review.id}`;
    const rating = review.star_count || 0;

    const starHtml = Array.from({ length: 5 }, (_, i) => {
        return `<i class="fa-solid fa-star star ${i < rating ? 'active' : ''}"></i>`;
    }).join('');

    const productImage = review.product.options[0].colors[0].images[0].img || "/static/assets/img/logo.png";

    const productName = review.product?.name || "Không rõ sản phẩm";
    const variant = review.product?.options?.[0]?.colors?.[0]?.color || "Không rõ phân loại";

    const mediaImages = review.media?.filter(m => m.img) || [];
    const mediaHtml = mediaImages.map(m => `
        <div class="imgBox">
            <img src="${m.img}" alt="Ảnh đánh giá">
        </div>
    `).join('');

    const hasReply = !!review.reviewReply;
    const replyContent = hasReply ? review.reviewReply.content : '';

    return `
    <div class="reviewBox" data-review-id="${review.id}">
        <div class="review">
            <div class="customer-info">
                <span class="material-symbols-outlined">person</span>
                <p>${fullName}</p>
                <div class="orderId">
                    <p>ID đánh giá ${orderCode}</p>
                </div>
            </div>
            <div class="review-info">
                <div class="col">
                    <div class="imgBox">
                        <img src="${productImage}" alt="">
                    </div>
                    <div>
                        <p>${productName}</p>
                        <p>Phân loại: ${variant}</p>
                    </div>
                </div>
                <div class="col">
                    <div class="starBox">
                        ${starHtml}
                    </div>
                    <div class="content">
                        <p>${review.content}</p>
                        <div class="imgReview">
                            ${mediaHtml}
                        </div>
                    </div>
                </div>
                <div class="col">
                    <button class="replyButton">${hasReply ? "Xem" : "Trả lời"}</button>
                </div>
            </div>
        </div>
        <div class="reviewReplyBox" style="display: ${hasReply ? 'flex' : 'none'}">
            <textarea rows="5" ${hasReply ? 'readonly' : ''} placeholder="Nhập nội dung phản hồi khách hàng">${replyContent}</textarea>
            <div>
                <button class="replyActionButton">${hasReply ? 'Cập nhật' : 'Xong'}</button>
            </div>
        </div>
    </div>
    `;
}

function attachReplyHandlers() {
    const boxes = document.querySelectorAll('.reviewBox');

    boxes.forEach(box => {
        const replyButton = box.querySelector('.replyButton');
        const replyBox = box.querySelector('.reviewReplyBox');
        const textarea = replyBox.querySelector('textarea');
        const actionButton = replyBox.querySelector('.replyActionButton');

        const reviewId = box.dataset.reviewId;

        replyButton.addEventListener('click', () => {
            replyBox.style.display = replyBox.style.display === 'none' ? 'flex' : 'none';
        });

        actionButton.addEventListener('click', () => {
            if (textarea.hasAttribute('readonly')) {
                textarea.removeAttribute('readonly');
                actionButton.textContent = 'Xong';
            } else {
                const replyText = textarea.value.trim();
                fetchApiUpdateReviewReply(reviewId, replyText)
                    .then(res => {
                        textarea.setAttribute('readonly', true);
                        actionButton.textContent = 'Cập nhật';

                        if (replyText === '') {
                            replyButton.textContent = 'Trả lời';
                            replyBox.style.display = 'none';
                        } else {
                            replyButton.textContent = 'Xem';
                        }
                    })
                    .catch(err => {
                        alert('Lỗi khi cập nhật: ' + err.message);
                    });
            }
        });
    });
}

function fetchApiReview(page = 1, star = null) {
  currentPage = page;
  currentStarFilter = star;

  fetchApiGet(page, star)
    .then(data => {
      const container = document.querySelector('.reviewContainer');
      container.innerHTML = '';

      if (!data.reviews || data.reviews.length === 0) {
        container.innerHTML = `<p class="no-reviews" style="text-align: center;font-size: 16px;">Không có đánh giá</p>`;
      } else {
        data.reviews.forEach(review => {
          const html = createReviewBox(review);
          container.insertAdjacentHTML('beforeend', html);
        });
      }

      attachReplyHandlers();
      renderPagination(data.total_pages, data.current_page);
    })
    .catch(err => {
      alert(err.message);
    });
}


fetchApiReview(1, null);
const starToIdMap = {
  'all': 'allStar',
  5: 'fiveStar',
  4: 'fourStar',
  3: 'threeStar',
  2: 'twoStar',
  1: 'oneStar'
};

['all', 5, 4, 3, 2, 1].forEach(star => {
  const id = starToIdMap[star];
  document.getElementById(id)?.addEventListener('click', () => {
    console.log(id);
    fetchApiReview(1, star === 'all' ? null : star);
  });
});
const statusAll = document.querySelector('.filter-status-row .all');
const statusHasReply = document.querySelector('.filter-status-row .has-reply');

statusAll.addEventListener('click', () => {
  currentStarFilter = null; // tương đương tất cả
  currentPage = 1;
  fetchApiReview(currentPage, currentStarFilter);
});

statusHasReply.addEventListener('click', () => {
  currentStarFilter = 6; // 6 đại diện cho "Đã trả lời"
  currentPage = 1;
  fetchApiReview(currentPage, currentStarFilter);
});
