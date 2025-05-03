from django.contrib.auth import authenticate, login as auth_login, logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import check_password
from django.contrib.auth.models import Group
from django.http import JsonResponse
from django.shortcuts import render, redirect
from rest_framework import status

from .models import User


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
