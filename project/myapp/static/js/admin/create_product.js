import {fetchApiGet, fetchApiPost, fetchApiPostCategory, fetchApiPostBrand} from '../service/admin_create_product/fetchApi.js';
const addOptionBtn = document.getElementById('add-option-btn');
const optionContainer = document.querySelector('.option-container-form');
const submit = document.querySelector('.submit');

const popupAddCategory = document.querySelector('.add_category');
const popupAddBrand = document.querySelector('.add_brand');
const btnAddBrand = document.querySelector('.btn-add.brand');
const btnAddCategory = document.querySelector('.btn-add.category');

const createOptionForm = () => {
    const optionDiv = document.createElement('div');
    optionDiv.classList.add('form-container', 'option-form');
    optionDiv.innerHTML = `
        <h2>Thêm version cho sản phẩm</h2>
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
        <div class="remove-option-form">
            <span class="material-symbols-outlined">close</span>
        </div>
    `;

    // Thêm xử lý nút xóa option
    optionDiv.querySelector('.remove-option-form').addEventListener('click', () => {
        optionDiv.remove();
    });

    // Xử lý thêm/xóa color form
    const colorList = optionDiv.querySelector('.color-list');
    const addColorBtn = optionDiv.querySelector('.add-color');

    addColorBtn.addEventListener('click', () => {
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
                <span class="material-symbols-outlined">close</span>
            </div>
        `;
        colorForm.querySelector('.remove-color-form').addEventListener('click', () => {
            colorForm.remove();
        });
         // Gắn sự kiện preview ảnh
        const inputImage = colorForm.querySelector("input[name='img']");
        const previewDiv = colorForm.querySelector(".image-preview");
        inputImage.addEventListener('change', () => {
            handleImagePreview(inputImage, previewDiv);
        });
        colorList.appendChild(colorForm);
    });

    // Xử lý thêm/xóa detail form
    const detailList = optionDiv.querySelector('.detail-list');
    const addDetailBtn = optionDiv.querySelector('.add-detail');

    addDetailBtn.addEventListener('click', () => {
        const detailForm = document.createElement('div');
        detailForm.classList.add('form-detail');
        detailForm.innerHTML = `
            <div class="input-group detail-value">
                <input type="text" placeholder="Nhập tên chi tiết" name="name-detail">
                <input type="text" placeholder="Nhập giá trị chi tiết" name="value-detail">
            </div>
            <div class="remove-detail-form">
                <span class="material-symbols-outlined">close</span>
            </div>
        `;
        detailForm.querySelector('.remove-detail-form').addEventListener('click', () => {
            detailForm.remove();
        });
        detailList.appendChild(detailForm);
    });

    return optionDiv;
};
const handleImagePreview = (inputFile, previewContainer) => {
    previewContainer.innerHTML = '';
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
            closeBtn.classList.add('material-symbols-outlined');
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

addOptionBtn.addEventListener('click', () => {
    console.log('click');
    const newOption = createOptionForm();
    optionContainer.appendChild(newOption);
});
const extractDataFormProduct = () => {
    const productForm = document.querySelector('.product-form');
    const slug = productForm.querySelector("input[name='slug-product']").value;
    const name = productForm.querySelector("input[name='name-product']").value;
    const category = productForm.querySelector("select[name='category']").value;
    const brand = productForm.querySelector("select[name='brand']").value;
    const imageInput = productForm.querySelector("input[type='file'][name='img']");

    const images = [];
    if (imageInput && imageInput.files.length > 0) {
        for (let i = 0; i < imageInput.files.length; i++) {
            images.push(imageInput.files[i]);
        }
    }

    return {
        slug,
        name,
        category,
        brand,
        images
    }
}
const extractDataFormOptionValidated = (optionForm, index) => {
    const version = optionForm.querySelector("input[name='version']").value.trim();
    const description = optionForm.querySelector("textarea[name='description']").value.trim();
    const slug = optionForm.querySelector("input[name='slug']").value.trim();

    if (!version) {
        throw new Error(`Vui lòng điền version cho phiên bản ${index + 1}.`);
    }
    if (!slug) {
        throw new Error(`Vui lòng điền slug cho phiên bản ${version}.`);
    }

    const formColorAll = optionForm.querySelectorAll('.form-color');
    if (formColorAll.length === 0) {
        throw new Error(`Vui lòng thêm ít nhất một màu sắc cho phiên bản ${version}.`);
    }

    const colors = [];
    formColorAll.forEach((formColor) => {
        const color = formColor.querySelector("input[name='color_name']").value.trim();
        const price = formColor.querySelector("input[name='price']").value.trim();
        const stock = formColor.querySelector("input[name='stock']").value.trim();

        if (!color) {
            throw new Error(`Vui lòng nhập màu sắc cho phiên bản ${version}.`);
        }
        if (!price) {
            throw new Error(`Vui lòng nhập giá cho phiên bản ${version} - ${color}.`);
        }
        if (!stock) {
            throw new Error(`Vui lòng nhập số lượng cho phiên bản ${version} - ${color}.`);
        }

        const imageInput = formColor.querySelector("input[type='file'][name='img']");
        const images = [];
        if (imageInput && imageInput.files.length > 0) {
            for (let i = 0; i < imageInput.files.length; i++) {
                images.push(imageInput.files[i]);
            }
        }

        colors.push({ color, price, stock, images });
    });

    const formDetailAll = optionForm.querySelectorAll('.form-detail');
    if (formDetailAll.length === 0) {
        throw new Error(`Vui lòng thêm ít nhất một chi tiết cho phiên bản ${version}.`);
    }

    const details = [];

    formDetailAll.forEach((formDetail) => {
        const name = formDetail.querySelector("input[name='name-detail']").value.trim();
        const value = formDetail.querySelector("input[name='value-detail']").value.trim();

        if (!name) {
            throw new Error(`Vui lòng nhập tên chi tiết cho phiên bản ${version}.`);
        }
        if (!value) {
            throw new Error(`Vui lòng nhập giá trị của chi tiết ${name} cho phiên bản ${version}.`);
        }

        details.push({ name, value });
    });

    if (!description) {
        throw new Error(`Vui lòng điền version và mô tả cho phiên bản ${version}.`);
    }

    return {
        version,
        slug,
        description,
        colors,
        details,
    };
};

submit.addEventListener('click', () => {
    const dataProduct = extractDataFormProduct();

    if (!dataProduct.slug.trim() || !dataProduct.name.trim() ||
        !dataProduct.category || !dataProduct.brand) {
        alert("Vui lòng điền đầy đủ thông tin sản phẩm (Slug, Tên, Danh mục, Nhà cung cấp).");
        return;
    }

    const optionForms = document.querySelectorAll('.option-form');
    if (optionForms.length === 0) {
        alert("Vui lòng thêm ít nhất một phiên bản sản phẩm.");
        return;
    }

    const dataOptions = [];
    try {
        optionForms.forEach((form, idx) => {
            const data = extractDataFormOptionValidated(form, idx);
            dataOptions.push(data);
        });
    } catch (err) {
        alert(err.message);
        return;
    }

    const formData = new FormData();
    formData.append('product', JSON.stringify({
        slug: dataProduct.slug,
        name: dataProduct.name,
        category: dataProduct.category,
        brand: dataProduct.brand,
    }));
    if (dataProduct.images.length > 0) {
        dataProduct.images.forEach(img => {
            formData.append('product_images', img);
        });
    }
    const optionsNoImages = dataOptions.map(opt => ({
        version: opt.version,
        slug: opt.slug,
        description: opt.description,
        details: opt.details,
        colors: opt.colors.map(color => ({
            color: color.color,
            price: color.price,
            stock: color.stock,
        })),
    }));
    formData.append('options', JSON.stringify(optionsNoImages));
    dataOptions.forEach((opt, optIndex) => {
        opt.colors.forEach((color, colorIndex) => {
            color.images.forEach(img => {
                formData.append(`option_images_${optIndex}_${colorIndex}`, img);
            });
        });
    });
    fetchApiPost(formData)
    .then(data => {
        if(data){
            const popupModelSuccess = document.querySelector('.popup-model.success.product');
            popupModelSuccess.classList.add('active');
        }
    })
    .catch(err => {
        alert(err.message || 'Tạo sản phẩm thất bại');
    })
});

const mainImageInput = document.querySelector("input[name='img']");
const mainPreviewContainer = document.querySelector(".image-preview");

mainImageInput.addEventListener('change', () => {
    handleImagePreview(mainImageInput, mainPreviewContainer);
});
const fetchDataBrandAndCategory = () => {
    fetchApiGet()
    .then(data => {
        const selectCategory = document.querySelector("select[name='category']");
        const selectBrand = document.querySelector("select[name='brand']");
        const ulCategory = popupAddCategory.querySelector('ul');
        const ulBrand = popupAddBrand.querySelector('ul');

        selectCategory.innerHTML = '';
        selectBrand.innerHTML = '';

        ulCategory.innerHTML = '';
        ulBrand.innerHTML = '';

        data.category.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            selectCategory.appendChild(option);

            const li = document.createElement('li');
            li.textContent= cat.name;
            ulCategory.appendChild(li);
        });

        data.brand.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.id;
            option.textContent = brand.name;
            selectBrand.appendChild(option);

            const li = document.createElement('li');
            li.textContent= brand.name;
            ulBrand.appendChild(li);
        });
    })
}
fetchDataBrandAndCategory();
btnAddBrand.addEventListener('click', () =>{
    if (!popupAddBrand.classList.contains('active')){
        popupAddBrand.classList.add('active')
    }
})
btnAddCategory.addEventListener('click', () =>{
    if (!popupAddCategory.classList.contains('active')){
        popupAddCategory.classList.add('active')
    }
})

const buttonAddCategory = popupAddCategory.querySelector('.submit');
const buttonAddBrand = popupAddBrand.querySelector('.submit');

buttonAddCategory.addEventListener('click', () => {
    const inputs = popupAddCategory.querySelectorAll('input');

    for (const input of inputs) {
        if (!input.value.trim()) {
            alert('Không được để trống trường nào');
            return;
        }
    }
    const name = popupAddCategory.querySelector("input[name='name']").value.trim();
    const slug = popupAddCategory.querySelector("input[name='slug']").value.trim();

    fetchApiPostCategory({ name, slug })
        .then(data => {
            if (popupAddCategory.classList.contains('active')) {
                popupAddCategory.classList.remove('active');
            }
            const popupModelSuccess = document.querySelector('.popup-model.success.category');
            if (popupModelSuccess) {
                popupModelSuccess.classList.add('active');
            }
            fetchDataBrandAndCategory();
        })
        .catch(err => {
            alert(err.message);
        });
});
buttonAddBrand.addEventListener('click', () => {
    const inputs = popupAddBrand.querySelectorAll('input');

    for (const input of inputs) {
        if (!input.value.trim()) {
            alert('Không được để trống trường nào');
            return;
        }
    }
    const name = popupAddBrand.querySelector("input[name='name']").value.trim();
    const slug = popupAddBrand.querySelector("input[name='slug']").value.trim();
    const origin  = popupAddBrand.querySelector("input[name='slug']").value.trim();

    fetchApiPostBrand({ name, slug, origin })
        .then(data => {
            if (popupAddBrand.classList.contains('active')) {
                popupAddBrand.classList.remove('active');
            }
            const popupModelSuccess = document.querySelector('.popup-model.success.brand');
            if (popupModelSuccess) {
                popupModelSuccess.classList.add('active');
            }
            fetchDataBrandAndCategory();
        })
        .catch(err => {
            alert(err.message);
        });
});