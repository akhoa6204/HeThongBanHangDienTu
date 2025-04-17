from django.shortcuts import render

from .models import Product, Option, Category


# Create your views here.
def home(request):
    try:
        categories = Category.objects.all()
        result = []
        for category in categories:
            products = Product.objects.filter(category_id=category.id).order_by('-purchased_count')
            final_product = []
            for product in products:
                option = Option.objects.filter(product_id=product.id).order_by('-discount')[:1]
                if option:
                    option = option[0]  # Lấy option đầu tiên
                    price = int(option.price) * (1 - (option.discount if option.discount else 0))
                    final_product.append({
                        "slugCategory": category.slug,
                        'slugProduct': option.slug,
                        "name": product.name,
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


def detail(request, slugCategory, slugProduct):
    try:
        option = Option.objects.filter(slug=slugProduct).first()
        if not option:
            print("Không tìm thấy Option với slug này.")
        else:
            product = Product.objects.get(id=option.product_id)
            options = Option.objects.filter(product_id=product.id)
            result = {}
            result['product'] = product
            for option in options:
                if option.version not in result:
                    result[option.version] = []

                result[option.version].append({
                    'color': option.color,
                    'price': option.price,
                    'img': option.img,
                    'memory_and_storage': option.memory_and_storage,
                    'rear_camera': option.rear_camera,
                    'front_camera': option.front_camera,
                    'os_and_cpu': option.os_and_cpu,
                    'connectivity': option.connectivity,
                    'display': option.display,
                    'battery_and_charging': option.battery_and_charging,
                    'design_and_weight': option.design_and_weight,
                    'general_information': option.general_information,
                    'utilities': option.utilities,
                    'product_overview': option.product_overview,
                    'warranty': option.warranty,
                    'discount': option.discount,
                    'promotion_start_date': option.promotion_start_date,
                    'promotion_end_date': option.promotion_end_date,
                    'promotion_description': option.promotion_description,
                    'description': option.description
                })
    except Exception as e:
        product = None
        option = None
    return render(request, 'page/public/detail.html', {'result': result})


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
