from django.shortcuts import render

# Create your views here.
def home(request):
    return render(request, 'page/public/home.html')
def login(request):
    return render(request, 'page/public/login.html')
def register(request):
    return render(request, 'page/public/register.html')


def search(request, nameProduct):
    return render(request, 'page/public/search.html')


def detail(request, nameProduct):
    return render(request, 'page/public/detail.html')


def cart(request):
    return render(request, 'page/public/cart.html')


def info_order(request):
    return render(request, 'page/public/info_order.html')


def payment_order(request):
    return render(request, 'page/public/payment_order.html')
