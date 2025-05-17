from django.contrib import messages
from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import Group
from django.http import JsonResponse
from django.shortcuts import redirect, get_object_or_404
from rest_framework import status, viewsets

from .models import User, Product, Category, Option
from .serializers import ProductSerializer


def home(request):
    return render(request, 'page/public/home.html')


def search(request):
    return render(request, 'page/public/search.html')


def detail(request, slugCategory, slugProduct, slugOption):
    return render(request, 'page/public/detail.html', )


@login_required
def info_order(request):
    return render(request, 'page/public/info_order.html')


@login_required
def cart(request):
    return render(request, 'page/public/cart.html')


@login_required
def payment_order(request):
    return render(request, 'page/public/payment_order.html')


@login_required
def orderStatus(request, idOrder):
    return render(request, 'page/public/order_status.html')


@login_required
def infoUser(request):
    return render(request, 'page/public/infoUser.html')


@login_required
def changePassword(request):
    if request.method == 'POST':
        currentPassword = request.POST.get('currentPassword')
        newPassword = request.POST.get('newPassword')
        user = request.user
        if check_password(currentPassword, user.password):
            user.set_password(newPassword)
            user.save()
            update_session_auth_hash(request, user)
            return JsonResponse({'message': 'Đổi mật khẩu thành công'}, status=status.HTTP_200_OK)
        else:
            return JsonResponse({'error-message-password': 'Sai mật khẩu'}, status=status.HTTP_400_BAD_REQUEST)
    return render(request, 'page/public/changePassword.html')


@login_required
def reviewProduct(request, idOrder):
    return render(request, 'page/public/review_product.html')


def is_admin(user):
    return user.groups.filter(name='Admin').exists()


def is_customer(user):
    return user.groups.filter(name='Customer').exists()


def login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)

        if user is not None:
            auth_login(request, user)
            if is_admin(user):
                return JsonResponse({'role': 'admin'}, status=status.HTTP_200_OK)
            elif is_customer(user):
                return JsonResponse({'role': 'customer'}, status=status.HTTP_200_OK)
            # else:
            #     return JsonResponse({'role': 'unknown'}, status=status.HTTP_200_OK)
        else:
            return JsonResponse({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

    return render(request, 'page/public/login.html')


def register(request):
    if request.method == 'POST':
        first_name = request.POST.get('firstName')
        last_name = request.POST.get('lastName')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        password = request.POST.get('password')
        if User.objects.filter(email=email).exists():
            return JsonResponse({'error-message-email': 'Email đã tồn tại'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            phone=phone,
            first_name=first_name,
            last_name=last_name
        )
        group = Group.objects.get(name='Customer')
        user.groups.add(group)
        return JsonResponse({'message': 'Đăng ký thành công'}, status=status.HTTP_200_OK)
    return render(request, 'page/public/register.html')


def logout_view(request):
    logout(request)
    return redirect('login')


def order(request):
    return render(request, 'page/public/order.html')


def forgotPassword(request):
    return render(request, 'page/public/forgot_password.html')


def verifyCode(request):
    return render(request, 'page/public/verifyOTP.html')


def resetPassword(request):
    return render(request, 'page/public/resetPassword.html')


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


@login_required
def admin_product_list(request):
    return render(request, 'page/admin/admin_product_list.html', )


@login_required
def edit_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    categories = Category.objects.all()

    if request.method == 'POST':
        product.name = request.POST.get('name')
        product.price = request.POST.get('price')
        product.quantity = request.POST.get('quantity')
        product.status = request.POST.get('status')

        try:
            category_id = request.POST.get('category')
            product.category = Category.objects.get(id=category_id)
        except Category.DoesNotExist:
            messages.error(request, 'Danh mục không hợp lệ!')
            return redirect('edit_product', product_id=product.id)

        product.save()
        messages.success(request, 'Sửa sản phẩm thành công!')
        return redirect('edit_product', product_id=product.id)

    return render(request, 'page/admin/edit_product.html', {
        'product': product,
        'categories': categories
    })


from django.http import HttpResponseNotFound


@login_required
def delete_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return HttpResponseNotFound('Sản phẩm này không tồn tại.')

    if request.method == 'POST':
        product.delete()
        messages.success(request, 'Đã xóa sản phẩm thành công!')
        return redirect('quantri-dashboard-products')
    return render(request, 'page/admin/confirm_delete.html', {'product': product})


@login_required
def create_product_page(request):
    if request.method == 'POST':
        # Lưu sản phẩm
        product = Product.objects.create(
            name=request.POST.get('name'),
            # thêm các trường khác như category, brand, img...
        )

        # Lưu các option từ request.POST
        options_data = {}
        for key in request.POST:
            if key.startswith('options['):
                field_path = key.split('[')
                idx = int(field_path[1][:-1])
                field = field_path[2][:-1]
                if idx not in options_data:
                    options_data[idx] = {}
                options_data[idx][field] = request.POST[key]

        for option in options_data.values():
            Option.objects.create(
                product=product,
                version=option.get('version'),
                color=option.get('color'),
                price=option.get('price') or 0,
                quantity=option.get('quantity') or 0,
                img=option.get('img') or ''
            )

        return redirect('admin_product_list')  # hoặc render lại trang

    return render(request, 'page/admin/create_product.html')


@login_required
def admin_review_list_view(request):
    return render(request, 'page/admin/review_list.html')


@login_required
def manage_order(request):
    return render(request, 'page/admin/admin_order.html')


@login_required
def order_detail_view(request, order_id):
    return render(request, 'page/admin/order_detail.html')


@login_required
def manage_bill(request):
    return render(request, 'page/admin/admin_manage_bill.html')


from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.conf import settings


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_product_detail_page(request, product_id):
    try:
        product = Product.objects.prefetch_related('options').get(id=product_id)
    except Product.DoesNotExist:
        return render(request, 'not_found.html', {"message": "Sản phẩm không tồn tại."})

    # Xử lý ảnh
    img_raw = product.img
    img_list = []
    if img_raw:
        img_list = [img.strip(';').strip() for img in img_raw.split(',') if img.strip()]

    img_urls = []
    for path in img_list:
        if path.startswith('http://') or path.startswith('https://'):
            img_urls.append(path)  # ảnh từ URL tuyệt đối
        else:
            img_urls.append(request.build_absolute_uri(settings.MEDIA_URL + path))  # ảnh từ thư mục media

    # Lấy các options của sản phẩm
    options = product.options.all()

    # Tạo context để truyền vào template
    context = {
        "product": {
            "name": product.name,
            "slug": product.slug,
            "category_name": product.category.name,
            "brand_name": product.brand.name,
            "img": img_urls
        },
        "options": options
    }
    print(options)
    return render(request, 'page/admin/admin_product_detail.html', context)
