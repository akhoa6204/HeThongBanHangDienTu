from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.shortcuts import redirect, render

from .utils import is_admin


def home(request):
    return render(request, 'page/public/home.html')


def search(request):
    return render(request, 'page/public/search.html')


def detail(request, slugCategory, slugProduct):
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


def login(request):
    return render(request, 'page/public/login.html')


def register(request):
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


@login_required
@user_passes_test(is_admin, login_url='home')
def admin_product_list(request):
    return render(request, 'page/admin/admin_product_list.html')


@user_passes_test(is_admin, login_url='home')
@login_required
def edit_product(request, product_id):
    return render(request, 'page/admin/edit_product.html')


@login_required
@user_passes_test(is_admin, login_url='home')
def create_product_page(request):
    return render(request, 'page/admin/create_product.html')


@login_required
@user_passes_test(is_admin, login_url='home')
def admin_review_list_view(request):
    return render(request, 'page/admin/review_list.html')


@login_required
@user_passes_test(is_admin, login_url='home')
def manage_order(request):
    return render(request, 'page/admin/admin_order.html')


@login_required
@user_passes_test(is_admin, login_url='home')
def order_detail_view(request, order_id):
    return render(request, 'page/admin/order_detail.html')
