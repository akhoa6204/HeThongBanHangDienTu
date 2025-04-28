from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.shortcuts import render, redirect

from .models import User
from .utils import contains_uppercase, contains_letter, contains_special_char


def home(request):
    return render(request, 'page/public/home.html')


def search(request, nameProduct):
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
        user = request.user
        if check_password(currentPassword, user.password):
            user.password = currentPassword
            user.save()
            print(user.password)
        else:
            print('Sai mật khẩu')
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

            redirect_url = 'home'
            if is_admin(user):
                redirect_url = 'admin_dashboard'
            elif is_customer(user):
                redirect_url = 'home'

            return redirect(redirect_url)
        else:
            errors = 'Sai tài khoản hoặc mật khẩu'
            return render(request, 'page/public/login.html', {'errors': errors})

    return render(request, 'page/public/login.html')


def register(request):
    if request.method == 'POST':
        first_name = request.POST.get('first_name')
        last_name = request.POST.get('last_name')
        phone = request.POST.get('phone')
        email = request.POST.get('email')
        password = request.POST.get('password')
        confirmPassword = request.POST.get('comfirmPassword')
        if not first_name:
            error = 'Tên không được để trống'
            return render(request, 'page/public/register.html', {'error_first_name': error})
        if not last_name:
            error = 'Họ không được để trống'
            return render(request, 'page/public/register.html', {'error_last_name': error})
        if not phone:
            error = 'Số điện thoại không được để trống'
            return render(request, 'page/public/register.html', {'error_phone': error})
        if User.objects.filter(phone=phone).exists():
            error = 'Số điện thoại đã được đăng kí'
            return render(request, 'page/public/register.html', {'error_phone': error})
        if not (len(password) > 6 and
                contains_uppercase(password) and
                contains_letter(password) and
                contains_special_char(password)):
            error = '(*) Mật khẩu tối thiểu 6 ký tự, có ít nhất 1 chữ in hoa và 1 kí tự đặc biệt. (VD: aA@123)'
            return render(request, 'page/public/register.html', {'error_password': error})
        if password != confirmPassword:
            error = 'Mật khẩu nhập lại không giống nhau'
            return render(request, 'page/public/register.html', {'error_confirmPassword': error})
        User.objects.create_user(
            username=phone,
            email=email,
            password=password,
            phone=phone,
            first_name=first_name,
            last_name=last_name
        )
        return redirect('login')
    return render(request, 'page/public/register.html')


def logout_view(request):
    logout(request)
    return redirect('login')


def order(request):
    return render(request, 'page/public/order.html')
