from django.urls import path

from . import api_views
from . import views

urlpatterns = [
    # API URL patterns
    path('api/home/', api_views.apiHome, name='api_home'),
    path('api/product/<str:slugCategory>/<str:slugProduct>/<str:slugOption>/', api_views.apiProductDetail,
         name="api_product"),
    path('api/reviews/<str:slugProduct>/<int:star>/<int:numberPage>/', api_views.apiReviews, name="api_reviews"),
    path('api/search/<str:slugSearch>/<int:numberPage>/', api_views.apiSearch, name='api_search'),
    path('api/order/', api_views.apiOrder, name='api_order'),
    path('api/cart/addProduct/', api_views.api_add_product_cart, name='api_cart_add_product'),
    path('api/cart/', api_views.api_cart, name='api_cart'),
    path('api/cart/remove_item/', api_views.api_cart_remove_item, name='api_cart_remove_item'),
    path('api/cart/update_quantity_item/', api_views.api_cart_update_quantity_item,
         name='api_cart_update_quantity_item'),

    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('', views.home, name='home'),
    path('search/<str:nameProduct>/', views.search, name='search'),
    path('<str:slugCategory>/<str:slugProduct>/<str:slugOption>/', views.detail, name='detail_option'),
    path('cart/', views.cart, name='cart'),

    path('info_order/', views.info_order, name='info_order'),

    path('payment_order/', views.payment_order, name='payment_order'),
    path('order_status/<int:idOrder>/', views.orderStatus, name='order_status'),
    path('info_user/', views.infoUser, name='infoUser'),
    path('change_password/', views.changePassword, name='change_password'),
    path('review_product/<int:idOrder>/', views.reviewProduct, name="review_product.css"),
]
