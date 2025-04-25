from django.contrib.auth import authenticate, login as auth_login
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect


def home(request):
    return render(request, 'page/public/home.html')


def register(request):
    return render(request, 'page/public/register.html')


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

            response = redirect(redirect_url)
            return response
        else:
            return render(request, 'page/public/login.html', {'error': 'Sai tài khoản hoặc mật khẩu'})

    return render(request, 'page/public/login.html')
