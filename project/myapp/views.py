from django.shortcuts import render

from .models import Product, Option, Category, Review, Brand


# Create your views here.
def home(request):
    try:
        categories = Category.objects.all()
        result = []
        for category in categories:
            products = Product.objects.filter(category_id=category.id).order_by('-purchased_count')[: 8]
            final_product = []
            for product in products:
                option = Option.objects.filter(product_id=product.id).order_by('-discount')[:1]
                if option:
                    option = option[0]  # Lấy option đầu tiên
                    price = int(option.price) * (1 - (option.discount if option.discount else 0))
                    final_product.append({
                        "slugCategory": category.slug,
                        'slugProduct': product.slug,
                        'slugOption': option.slug,
                        "name": product.name + " (" + option.version + ")",
                        "img": product.img,
                        "discount": option.discount,
                        "price": "{:,.0f}".format(price),
                        "old_price": "{:,.0f}".format(int(option.price)),
                    })
            result.append({
                'category': category.name,
                'products': final_product
            })

    except Exception as e:
        print(f"Error: {e}")
        result = None
    return render(request, 'page/public/home.html', {"results": result})


def login(request):
    return render(request, 'page/public/login.html')


def register(request):
    return render(request, 'page/public/register.html')


def search(request, nameProduct):
    return render(request, 'page/public/search.html')


def detail(request, slugCategory, slugProduct, slugOption):
    product = Product.objects.get(slug=slugProduct)
    versions = Option.objects.filter(product_id=product.id)
    brand_name = Brand.objects.get(id=product.brand_id).name
    category_name = Category.objects.get(slug=slugCategory).name
    options = {}
    options_color = []
    selected_slug = slugOption

    current_versions_raw = Option.objects.filter(product_id=product.id, slug=slugOption)
    selected_color = current_versions_raw.first().color if current_versions_raw else None
    selected_version = current_versions_raw.first().version if current_versions_raw else None

    current_versions = []
    for version in current_versions_raw:
        if version.version == selected_version:
            imgList = [img.strip(';').strip() for img in version.img.split(',')]
            current_versions.append({
                'category_name': category_name,
                'brand_name': brand_name,
                'version': version.version,
                'color': version.color,
                'img': imgList,
                'price': version.price,
                'quantity': version.quantity,
                'memory_and_storage': version.memory_and_storage,
                'rear_camera': version.rear_camera,
                'os_and_cpu': version.os_and_cpu,
                'display': version.display,
                'discount': version.discount,
                'description': version.description,
            })

    # Xử lý các version và color
    for version in versions:
        if version.version not in options:
            options[version.version] = {
                "slug": version.slug
            }
        if version.slug == slugOption and version.color not in options_color:
            options_color.append(version.color)

    reviews = Review.objects.filter(product_id=product.id)
    print(len(reviews))
    return render(request, 'page/public/detail.html', {
        'product': product,
        'options': options,
        'current_versions': current_versions,
        'selected_version': selected_version,
        'reviews': reviews if len(reviews) > 0 else None,
        'slugCategory': slugCategory,
        'slugProduct': slugProduct,
        'selected_slug': selected_slug,
        'selected_color': selected_color,
        'options_color': options_color
    })


def cart(request):
    return render(request, 'page/public/cart.html')


def info_order(request):
    return render(request, 'page/public/info_order.html')


def payment_order(request):
    return render(request, 'page/public/payment_order.html')


def orderStatus(request, idOrder):
    return render(request, 'page/public/order_status.html')


def infoUser(request):
    return render(request, 'page/public/infoUser.html')


def changePassword(request):
    return render(request, 'page/public/changePassword.html')


def reviewProduct(request, idOrder):
    return render(request, 'page/public/review_product.html')
