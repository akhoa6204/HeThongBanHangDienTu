from django.urls import path

from . import views

urlpatterns =[
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('', views.home, name='home'),
    path('search/<str:nameProduct>', views.search, name='search'),
    path('detail/<str:nameProduct>', views.detail, name='detail'),
    path('cart/', views.cart, name='cart'),
    path('info_order/', views.info_order, name='info_order'),
    path('payment_order/', views.payment_order, name='payment_order'),
]