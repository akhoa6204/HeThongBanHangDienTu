import { fetchApiGetData, fetchApiUpdateProduct, fetchApiUpdateOption, fetchApiDeleteOption } from '../service/admin_product_edit/fetchApi.js';
import {fetchApiGet} from '../service/admin_create_product/fetchApi.js';
const selectCategory = document.querySelector("select[name='category']");
const selectBrand = document.querySelector("select[name='brand']");
const pathParts = window.location.pathname.split('/');
const productId = pathParts[4];
const productEditBtn = document.querySelector('.btn-edit-product');
const productSubmitContainer = document.querySelector('.product-form .submitContainer');
const productCancelBtn = productSubmitContainer.querySelector('.back');
const productSubmitBtn = productSubmitContainer.querySelector('.submit');
const productForm = document.querySelector('.product-form');
const inputImage = productForm.querySelector("input[type='file']");
const image_preview = productForm.querySelector(".image-preview");

inputImage.addEventListener('change', () => {
    handleImagePreview(inputImage, image_preview);
});
let initialImageIds = [];
let original_data;
const handleImagePreview = (inputFile, previewContainer) => {
    const files = inputFile.files;
    if (!files || files.length === 0) return;

    [...files].forEach(file => {
        if (!file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = e => {
            const imgBox = document.createElement('div');
            imgBox.classList.add('img-box');

            const img = document.createElement('img');
            img.src = e.target.result;
            img.alt = 'Ảnh sản phẩm';

            const closeBtn = document.createElement('span');
            closeBtn.classList.add('material-symbols-outlined', 'btn-remove');
            closeBtn.innerText = 'close';

            closeBtn.addEventListener('click', () => {
                imgBox.remove();
            });

            imgBox.appendChild(img);
            imgBox.appendChild(closeBtn);
            previewContainer.appendChild(imgBox);
        };
        reader.readAsDataURL(file);
    });
};
const createOptionForm = (dataOption = null) => {
    const index = document.querySelectorAll('.form-container.option-form').length;
    const optionDiv = document.createElement('div');
    optionDiv.classList.add('form-container', 'option-form');
    optionDiv.innerHTML = `
        <div class="main-form">
            <h2>Chi tiết version của sản phẩm</h2>
            <div class="form">
                <div class="input-group">
                    <label>Phiên bản (version): <input type="text" name="version" /></label>
                </div>
                <div class="input-group">
                    <label>Slug: <input type="text" name="slug" /></label>
                </div>
                <div class="color">
                    <div class="color-list"></div>
                    <button class="add-color">➕ Thêm màu</button>
                </div>
                <div class="detail">
                    <div class="detail-list"></div>
                    <button class="add-detail">➕ Thêm chi tiết sản phẩm</button>
                </div>
                <div class="input-group desc">
                    <label>Mô tả <br/><textarea name="description" rows="10" class="form-input"></textarea></label>
                </div>
            </div>
            <div class="btn-edit-option">
                <span class="material-symbols-outlined">edit</span>
            </div>
        </div>
        <div class="submitContainer option-submit">
            <button class="submit">Lưu thay đổi</button>
            <button class="back">Hủy</button>
            <button class="delete-option" style="background-color:yellow; color: black;">Xóa phiên bản</button>
        </div>
    `;

    if (dataOption) {
        optionDiv.dataset.id = dataOption.id;
        optionDiv.querySelector("input[name='version']").value = dataOption.version || '';
        optionDiv.querySelector("input[name='slug']").value = dataOption.slug || '';
        optionDiv.querySelector("textarea[name='description']").value = dataOption.description || '';
    }else{
        optionDiv.classList.add('new-option-form');
    }

    const editBtn = optionDiv.querySelector('.btn-edit-option');
    const submitContainer = optionDiv.querySelector('.option-submit');
    const cancelBtn = submitContainer.querySelector('.back');
    const submitBtn = submitContainer.querySelector('.submit');
    const deleteBtn = submitContainer.querySelector('.delete-option');

    editBtn.addEventListener('click', () => {
        const isActive = submitContainer.classList.toggle('active');
        setOptionFormEditable(isActive, optionDiv);
    });
    submitBtn.addEventListener('click', () => updateOption(optionDiv));
    deleteBtn.addEventListener('click', () => deleteOption(optionDiv));
    cancelBtn.addEventListener('click', () => {
        submitContainer.classList.remove('active');
        setOptionFormEditable(false, optionDiv);
    });

    const colorList = optionDiv.querySelector('.color-list');
    const addColorBtn = optionDiv.querySelector('.add-color');
    const addColorForm = (colorData = null) => {
        const colorForm = document.createElement('div');
        colorForm.classList.add('form-color');
        colorForm.innerHTML = `
            <div class="input-group">
                <label>Màu sắc: <input type="text" name="color_name"></label>
            </div>
            <div class="input-group">
                <label>Giá phiên bản: <input type="number" name="price" step="100000"/></label>
            </div>
            <div class="input-group">
                <label>Kho: <input type="number" name="stock" min="0" /></label>
            </div>
            <div class="input-group">
                <label>
                    <p>Ảnh sản phẩm</p>
                    <p>
                        <span class="material-symbols-outlined">add_photo_alternate</span>
                        <span>Chọn ảnh</span>
                        <input type="file" name="img" multiple accept="image/*">
                    </p>
                </label>
            </div>
            <div class="image-preview"></div>
            <div class="remove-color-form">
                <span class="material-symbols-outlined btn-remove">close</span>
            </div>
        `;
        if (colorData) {
            colorForm.dataset.id = colorData.id;
            colorForm.querySelector("input[name='color_name']").value = colorData.color || '';
            colorForm.querySelector("input[name='price']").value = Number(colorData.price) || '';
            colorForm.querySelector("input[name='stock']").value = colorData.stock || 0;
            colorData.images.forEach(image=>{
                const imgBox = document.createElement('div');
                imgBox.classList.add('img-box');
                const img = document.createElement('img');
                imgBox.dataset.id = image.id;
                img.src = image.img;
                img.alt = 'Ảnh sản phẩm';

                const closeBtn = document.createElement('span');
                closeBtn.classList.add('material-symbols-outlined', 'btn-remove');
                closeBtn.innerText = 'close';

                closeBtn.addEventListener('click', () => {
                    imgBox.remove();
                });

                imgBox.appendChild(img);
                imgBox.appendChild(closeBtn);
                colorForm.querySelector(".image-preview").appendChild(imgBox);
            })
        }

        colorForm.querySelector('.remove-color-form').addEventListener('click', () => {
            colorForm.remove();
        });

        const inputImage = colorForm.querySelector("input[name='img']");
        const previewDiv = colorForm.querySelector(".image-preview");
        inputImage.addEventListener('change', () => {
            handleImagePreview(inputImage, previewDiv);
        });

        colorList.appendChild(colorForm);
    };

    addColorBtn.addEventListener('click', () => addColorForm());

    if (dataOption && dataOption.colors) {
        dataOption.colors.forEach(c => {
            addColorForm(c)
        });
    }

    const detailList = optionDiv.querySelector('.detail-list');
    const addDetailBtn = optionDiv.querySelector('.add-detail');
    const addDetailForm = (detailData = null) => {
        const detailForm = document.createElement('div');
        detailForm.classList.add('form-detail');
        detailForm.innerHTML = `
            <div class="input-group detail-value">
                <input type="text" placeholder="Nhập tên chi tiết" name="name-detail">
                <input type="text" placeholder="Nhập giá trị chi tiết" name="value-detail">
            </div>
            <div class="remove-detail-form">
                <span class="material-symbols-outlined btn-remove">close</span>
            </div>
        `;

        if (detailData) {
            detailForm.dataset.id = detailData.id;
            detailForm.querySelector("input[name='name-detail']").value = detailData.name || '';
            detailForm.querySelector("input[name='value-detail']").value = detailData.value || '';
        }

        detailForm.querySelector('.remove-detail-form').addEventListener('click', () => {
            detailForm.remove();
        });
        detailList.appendChild(detailForm);
    };

    addDetailBtn.addEventListener('click', () => addDetailForm());

    if (dataOption && dataOption.details) {
        dataOption.details.forEach(d => addDetailForm(d));
    }
    setOptionFormEditable(false, optionDiv);
    return optionDiv;
};
const renderOptionFormsFromData = (optionsData) => {
    const optionContainer= document.querySelector('.option-container-form');
    optionContainer.innerHTML = '';
    optionsData.forEach(option => {
        const form = createOptionForm(option);
        optionContainer.appendChild(form);
    });
    updateDeleteOptionButtons();
};
function renderProduct(product){
    const slug = productForm.querySelector("input[name='slug-product']");
    const name = productForm.querySelector("input[name='name-product']");
    slug.value = product.slug;
    name.value = product.name;
    selectCategory.value = product.category.id;
    selectBrand.value = product.brand.id;

    image_preview.innerHTML = '';
    initialImageIds = [];

    product.images.forEach(image => {
        const imgBox = document.createElement('div');
        imgBox.classList.add('img-box');
        imgBox.dataset.id = image.id;

        const img = document.createElement('img');
        img.src = image.img;
        img.alt = 'Ảnh sản phẩm';

        const closeBtn = document.createElement('span');
        closeBtn.classList.add('material-symbols-outlined', 'btn-remove');
        closeBtn.innerText = 'close';

        closeBtn.addEventListener('click', () => {
            imgBox.remove();
        });

        imgBox.appendChild(img);
        imgBox.appendChild(closeBtn);
        image_preview.appendChild(imgBox);

        initialImageIds.push(image.id);
    });

    setProductFormEditable(false);
}
fetchApiGet()
.then(data => {
    selectCategory.innerHTML = '';
    selectBrand.innerHTML = '';

    data.category.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        selectCategory.appendChild(option);
    });

    data.brand.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.id;
        option.textContent = brand.name;
        selectBrand.appendChild(option);
    });
})
fetchApiGetData(productId)
.then(data => {
    console.log(data);
    original_data= data;
    renderProduct(data.product);
    renderOptionFormsFromData(data.product.options)
})

productEditBtn.addEventListener('click', () => {
    const isActive = productSubmitContainer.classList.toggle('active');
    setProductFormEditable(isActive);
});

productCancelBtn.addEventListener('click', () => {
    productSubmitContainer.classList.remove('active');
    setProductFormEditable(false);
});

function setProductFormEditable(editable) {
    const productForm = document.querySelector('.product-form');
    const inputs = productForm.querySelectorAll("input, select, textarea");
    inputs.forEach(input => {
        input.disabled = !editable;
    });

    const closeBtns = productForm.querySelectorAll('.btn-remove');
    closeBtns.forEach(btn => {
        btn.style.display = editable ? 'inline-block' : 'none';
    });
}
function setOptionFormEditable(editable, optionDiv) {
    const inputs = optionDiv.querySelectorAll("input, textarea, select");
    inputs.forEach(input => {
        input.disabled = !editable;
    });

    const closeBtns = optionDiv.querySelectorAll('.btn-remove');
    closeBtns.forEach(btn => {
        btn.style.display = editable ? 'inline-block' : 'none';
    });

    const addButtons = optionDiv.querySelectorAll('.add-color, .add-detail');
    addButtons.forEach(btn => {
        btn.style.display = editable ? 'inline-block' : 'none';
    });

    const removeForms = optionDiv.querySelectorAll('.remove-color-form, .remove-detail-form');
    removeForms.forEach(div => {
        div.style.display = editable ? 'block' : 'none';
    });
}
function collectProductFormData() {
    const productForm = document.querySelector('.product-form');
    const name = productForm.querySelector("input[name='name-product']").value.trim();
    const slug = productForm.querySelector("input[name='slug-product']").value.trim();
    const category = productForm.querySelector("select[name='category']").value;
    const brand = productForm.querySelector("select[name='brand']").value;

    const imageInput = productForm.querySelector("input[type='file']");
    const newImages = imageInput.files;

    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug);
    formData.append('category', category);
    formData.append('brand', brand);

    for (let i = 0; i < newImages.length; i++) {
        formData.append('images', newImages[i]);
    }

    const currentImageIds = Array.from(productForm.querySelectorAll('.image-preview .img-box'))
        .map(div => parseInt(div.dataset.id))
        .filter(Boolean);

    const deleteImageIds = initialImageIds.filter(id => !currentImageIds.includes(id));

    formData.append('deleted_ids', JSON.stringify(deleteImageIds));
    return formData;
}

productSubmitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const formData = collectProductFormData();
    fetchApiUpdateProduct(productId, formData)
    .then(data => {
        console.log(data);
        const popupSuccessProduct = document.querySelector('.popup-model.success.product')
        popupSuccessProduct.classList.add('active');
        renderProduct(data.product);

        initialImageIds = data.product.images.map(img => img.id);
        productEditBtn.click();
    })
    .catch(err => {
        const popupErrorProduct = document.querySelector('.popup-model.error.product')
        popupErrorProduct   .classList.add('active');
        renderProduct(original_data.product);
    })
});

function collectOptionFormData(optionDiv) {
    const option = {
        id: optionDiv.dataset.id || null,
        version: optionDiv.querySelector("input[name='version']").value.trim(),
        slug: optionDiv.querySelector("input[name='slug']").value.trim(),
        description: optionDiv.querySelector("textarea[name='description']").value.trim(),
        colors: [],
        details: []
    };

    // collect colors
    const colorForms = optionDiv.querySelectorAll('.form-color');
    colorForms.forEach(colorForm => {
        const color = {
            id: colorForm.dataset.id || null,
            color: colorForm.querySelector("input[name='color_name']").value.trim(),
            price: colorForm.querySelector("input[name='price']").value,
            stock: colorForm.querySelector("input[name='stock']").value,
            new_images: [],
            keep_image_ids: []
        };

        // Lấy ảnh mới
        const fileInput = colorForm.querySelector("input[type='file']");
        if (fileInput?.files.length > 0) {
            color.new_images = [...fileInput.files];
        }

        // Lấy ảnh cũ còn giữ
        const imageBoxes = colorForm.querySelectorAll(".image-preview .img-box");
        imageBoxes.forEach(box => {
            const imgId = parseInt(box.dataset.id);
            if (imgId) color.keep_image_ids.push(imgId);
        });

        option.colors.push(color);
    });

    // collect details
    const detailForms = optionDiv.querySelectorAll('.form-detail');
    detailForms.forEach(detailForm => {
        const detail = {
            id: detailForm.dataset.id || null,
            name: detailForm.querySelector("input[name='name-detail']").value.trim(),
            value: detailForm.querySelector("input[name='value-detail']").value.trim()
        };
        option.details.push(detail);
    });

    return option;
}
const addOptionBtn = document.getElementById('add-option-btn');

addOptionBtn.addEventListener('click', () => {
    const optionContainer = document.querySelector('.option-container-form');
    const newOptionForm = createOptionForm(); // tạo form option mới rỗng
    optionContainer.appendChild(newOptionForm);

    // Bật chế độ chỉnh sửa cho form mới
    setOptionFormEditable(true, newOptionForm);
    newOptionForm.querySelector('.option-submit').classList.add('active');
    updateDeleteOptionButtons();
});
const deleteOption = (optionDiv) => {
    const popupModelErrorAcceptOption = document.querySelector('.popup-model.error.accept_option');
    const popupModelSuccessDeleteOption = document.querySelector('.popup-model.success.delete_option');
    const popupModelErrorDeleteOption = document.querySelector('.popup-model.error.delete_option');
    popupModelErrorAcceptOption.classList.add('active');
    const accept = popupModelErrorAcceptOption.querySelector('.accept');
    const onAcceptClick = () => {
        popupModelErrorAcceptOption.classList.remove('active');

        if (optionDiv.classList.contains('new-option-form')) {
            optionDiv.remove();
            updateDeleteOptionButtons();
        } else {
            fetchApiDeleteOption(optionDiv.dataset.id)
                .then(() => {
                    optionDiv.remove();
                    updateDeleteOptionButtons();
                    popupModelSuccessDeleteOption.classList.add('active');
                })
                .catch((err) => {
                    alert(err.message);
                    popupModelErrorDeleteOption.classList.add('active');
                });
        }
    };
    accept.addEventListener('click', onAcceptClick, { once: true });
}

const updateOption = (optionDiv) => {
    // Dữ liệu object
    const optionData = collectOptionFormData(optionDiv);

    const formData = new FormData();

    // Đẩy các trường cơ bản
    formData.append("id", optionData.id || "");
    formData.append("version", optionData.version);
    formData.append("slug", optionData.slug);
    formData.append("description", optionData.description);
    // Đẩy color
    optionData.colors.forEach((color, colorIndex) => {
        formData.append(`colors[${colorIndex}][id]`, color.id || "");
        formData.append(`colors[${colorIndex}][color]`, color.color);
        formData.append(`colors[${colorIndex}][price]`, color.price);
        formData.append(`colors[${colorIndex}][stock]`, color.stock);

        // Ảnh mới (file upload)
        color.new_images.forEach((file, fileIndex) => {
            formData.append(`colors[${colorIndex}][new_images][${fileIndex}]`, file);
        });

        // Ảnh cũ giữ lại (id)
        color.keep_image_ids.forEach((id, idIndex) => {
            formData.append(`colors[${colorIndex}][keep_image_ids][${idIndex}]`, id);
        });
    });
    // Đẩy detail
    optionData.details.forEach((detail, detailIndex) => {
        formData.append(`details[${detailIndex}][id]`, detail.id || "");
        formData.append(`details[${detailIndex}][name]`, detail.name);
        formData.append(`details[${detailIndex}][value]`, detail.value);
    });
    
    fetchApiUpdateOption(productId, optionData.id || "", formData)
        .then(data => {
            const newForm = createOptionForm(data.option);
            optionDiv.replaceWith(newForm);
            updateDeleteOptionButtons()
            if(optionData.id){
                const popupSuccessOption = document.querySelector('.popup-model.success.option')
                popupSuccessOption.classList.add('active');
            }
            else{
                const popupSuccessCreateOption = document.querySelector('.popup-model.success.create-option')
                popupSuccessCreateOption.classList.add('active');
            }
        })
        .catch(err => {
//            alert(err.message);
            if(optionData.id){
                const popupSuccessOption = document.querySelector('.popup-model.error.option')
                popupSuccessOption.classList.add('active');
            }else{
                const popupSuccessOption = document.querySelector('.popup-model.error.create-option')
                popupSuccessOption.classList.add('active');
            }
        })
}
const updateDeleteOptionButtons = () => {
    const optionContainerForm = document.querySelector('.option-container-form');
    const allOptionForms = optionContainerForm.querySelectorAll('.form-container.option-form');
    const showDelete = allOptionForms.length > 1;
    allOptionForms.forEach(form => {
        const deleteBtn = form.querySelector('.delete-option');
        if (deleteBtn) {
            deleteBtn.style.display = showDelete ? 'inline-block' : 'none';
        }
    });
};

