import {fetchApiOrderItem, fetchAddNewReview} from '../service/reviewProduct/fetchApi.js';
const reviewBox = document.querySelector('.reviewBox');
const path = window.location.pathname;
const orderId = path.split('/')[2];
const backAll = document.querySelectorAll('.back');
const submit = document.querySelector('.success');
function loadProduct(data){
    let html = '';
    data.forEach((review, index) => {
        html += `
            <div class="itemReviewContainer">
                <div class="productReview">
                    <div class="product">
                        <div class="info">
                            <img
                                src ="${review.option.img[0]}"
                                alt="img product"
                            />
                            <p>${review.option.product.name} - ${review.option.version} - ${review.option.color}</p>
                        </div>
                    </div>
                    <div class="review">
                        <p><strong>Đánh giá sản phẩm</strong></p>
                        <div class="starBox">
                            <span class="material-symbols-outlined star"> kid_star </span>
                            <span class="material-symbols-outlined star"> kid_star </span>
                            <span class="material-symbols-outlined star"> kid_star </span>
                            <span class="material-symbols-outlined star"> kid_star </span>
                            <span class="material-symbols-outlined star"> kid_star </span>
                        </div>
                    </div>
                </div>
                <div class="formReview">
                    <form action="" class="content">
                        <div class="formGroup">
                            <label for="quality_${index}">Chất lượng sản phẩm:</label>
                            <input type="text" id="quality_${index}" placeholder="Để lại đánh giá."/>
                        </div>
                        <div class="formGroup">
                            <label for="description_${index}">Đúng với mô tả:</label>
                            <input type="text" id="description_${index}" placeholder="Đúng với mô tả"/>
                        </div>
                        <div class="formGroup">
                            <label for="features_${index}">Tính năng nổi bật:</label>
                            <input type="text" id="features_${index}" placeholder="Tính năng nổi bật"/>
                        </div>
                         <div class="formGroup contentInput">
                            <input type="text" id="content_${index}" placeholder="Nội dung đánh giá"/>
                        </div>
                        <p>
                            Hãy chia sẻ những điều bạn thích về sản phẩm này với những người mua
                            khác nhé.
                        </p>
                        <div class="formGroup">
                            <label for="file_${index}" class ='img'>
                                <span class="material-symbols-outlined"> photo_camera </span>
                                <span>Thêm Hình ảnh/ Video</span>
                            </label>
                            <input type="file" accept="image/*"  id="file_${index}" multiple/>
                        </div>
                        <div class="mediaPreviewContainer"></div>
                    </form>
                </div>
            </div>
        `
    })
    reviewBox.innerHTML = html;
     const reviewAll = document.querySelectorAll('.review');
    reviewAll.forEach((review) => {
        const stars = Array.from(review.querySelectorAll('.star'));
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                stars.forEach((s, i) => {
                    if (i >= index) {
                        s.classList.add('selected');
                    } else {
                        s.classList.remove('selected');
                    }
                });
            });
        });
    });
}
function setUpClick() {
    backAll.forEach(back => {
        back.addEventListener('click', () => {
            window.location.href = '/purchase/';
        });
    });

    submit.addEventListener('click', () => {
        const itemReviewContainerAll = document.querySelectorAll('.itemReviewContainer');
        const formData = new FormData();

        const promises = [];

        itemReviewContainerAll.forEach((item, index) => {
            const starCount = item.querySelectorAll('.starBox .star.selected').length;
            const quality = item.querySelector('input[id*="quality"]').value;
            const description = item.querySelector('input[id*="description"]').value;
            const features = item.querySelector('input[id*="features"]').value;
            const content = item.querySelector('input[id*="content"]').value;

            formData.append(`reviews[${index}][starCount]`, starCount);
            formData.append(`reviews[${index}][quality]`, quality);
            formData.append(`reviews[${index}][description]`, description);
            formData.append(`reviews[${index}][features]`, features);
            formData.append(`reviews[${index}][content]`, content);

            const fileInput = item.querySelector(`input[type="file"]`);
            const files = Array.from(fileInput.files)
                .filter(file => file.type.startsWith('image/'))
                .slice(0, 5);

            files.forEach((file, i) => {
                formData.append(`reviews[${index}][mediaFiles]`, file);
            });
        });

        fetchAddNewReview(orderId, formData)
            .then(data => {
                if(data.status == 'success'){
                    const popupModel = document.querySelector('.popup-model');
                    popupModel.classList.add('active');
                }
            });

    });
}
function setUpUploadImage() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach((fileInput) => {
        const mediaPreviewContainer = fileInput.closest('.formReview').querySelector('.mediaPreviewContainer');

        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files)
                .filter(file => file.type.startsWith('image/'))
                .slice(0, 5);
            if (!files.length) return;
            files.forEach(file => {
                const reader = new FileReader();

                reader.onload = function(event) {
                    if (mediaPreviewContainer.children.length >= 5) {
                        return;
                    }

                    const previewDiv = document.createElement('div');
                    previewDiv.classList.add('preview-image');

                    previewDiv.innerHTML = `
                        <img src="${event.target.result}" alt="preview image" />
                        <span class="material-symbols-outlined close-btn">close</span>
                    `;

                    mediaPreviewContainer.appendChild(previewDiv);

                    const closeBtn = previewDiv.querySelector('.close-btn');
                    closeBtn.addEventListener('click', () => {
                        previewDiv.remove();
                    });
                };

                reader.readAsDataURL(file);
            });
        });
    });
}
fetchApiOrderItem(orderId)
.then(data => {
    if (data){
        console.log(data);
        loadProduct(data);
        setUpUploadImage();
        setUpClick();
    }else{
        window.location.href ='/';
    }
})