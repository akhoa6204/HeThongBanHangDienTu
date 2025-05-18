from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from . import api_views, admin_api
from . import views
from .api_views import homeApiView, infoUserApiView, searchApiView, orderApiView

urlpatterns = [
    path('api/home/get/', homeApiView.as_view(), name='api_home'),
    path('api/product/<str:slugCategory>/<str:slugProduct>/<str:slugOption>/', api_views.apiProductDetail,
         name="api_product"),
    path('api/reviews/<str:slugProduct>/<int:star>/<int:numberPage>/', api_views.apiReviews, name="api_reviews"),
    path('api/search/', searchApiView.as_view(), name='api_search'),
    path('api/order/', api_views.apiOrder, name='api_order'),
    path('api/setOrderProduct/', api_views.api_order_product, name='api_order_product'),
    path('api/setOrderUser/', api_views.api_order_user, name='api_order_user'),
    path('api/cart/addProduct/', api_views.api_add_product_cart, name='api_cart_add_product'),
    path('api/cart/', api_views.api_cart, name='api_cart'),
    path('api/cart/remove_item/', api_views.api_cart_remove_item, name='api_cart_remove_item'),
    path('api/cart/update_quantity_item/', api_views.api_cart_update_quantity_item,
         name='api_cart_update_quantity_item'),
    path('api/payment/', api_views.api_payment, name='api_payment'),
    path('api/successOrder/', api_views.api_successOrder, name='api_successOrder'),
    path('api/authenticated/', api_views.api_authenticated, name='api_authenticated'),
    path('api/purchase/<str:status>/<int:page>/', api_views.api_purchase, name='api_purchase'),
    path('api/review/<int:idOrder>/', api_views.api_review, name='api_review'),
    path('api/add_new_review/<int:idOrder>/', api_views.api_add_new_review, name='api_add_new_review'),
    path('api/order_status/<int:idOrder>/', api_views.api_orderStatus, name='api_orderStatus'),
    path('api/info_user/get/', infoUserApiView.as_view(), name='api_info_user_get'),
    path('api/infoUser/patch/', infoUserApiView.as_view(), name='api_info_user_patch'),
    path('api/order/patch/<int:orderId>/', orderApiView.as_view(), name='api_update_order'),
    path('api/forgotPassword/', api_views.apiCheckEmail, name='api_forgotPassword'),
    path('api/checkOTP/', api_views.apiCheckOTP, name='api_checkOTP'),
    path('api/generateOTP/', api_views.apiGenerateOtp, name='api_generateOTP'),
    path('api/resetPassword/', api_views.apiResetPassword, name='api_resetPassword'),
    path('api/changePassword/', api_views.apiChangePassword, name='api_changePassword'),
    path('api/login/', api_views.apiLogin, name='api_login'),
    path('api/register/', api_views.apiRegister, name='api_register'),

    path('login/', views.login, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register, name='register'),
    path('', views.home, name='home'),
    path('search/', views.search, name='search'),
    path('detail/<str:slugCategory>/<str:slugProduct>/<str:slugOption>/', views.detail, name='detail_option'),
    path('cart/', views.cart, name='cart'),

    path('info_order/', views.info_order, name='info_order'),
    path('purchase/', views.order, name='order'),
    path('payment_order/', views.payment_order, name='payment_order'),
    path('order_status/<int:idOrder>/', views.orderStatus, name='order_status'),
    path('info_user/', views.infoUser, name='infoUser'),
    path('change_password/', views.changePassword, name='change_password'),
    path('review/<int:idOrder>/', views.reviewProduct, name="review_product"),
    path('forgot_password/', views.forgotPassword, name="forgot_password"),
    path('verify-code/', views.verifyCode, name="verifyCode"),
    path('reset-password/', views.resetPassword, name="resetPassword"),

    # ----------- API Quản trị sản phẩm ----------
    path('quantri/products/', admin_api.admin_list_products, name='admin-list-products'),
    path('quantri/products/create/', admin_api.admin_create_product, name='admin-create-product'),
    path('quantri/products/<int:product_id>/', admin_api.admin_view_product, name='admin-view-product'),
    path('quantri/products/<int:product_id>/update/', admin_api.admin_update_product, name='admin-update-product'),
    path('quantri/products/<int:product_id>/delete/', admin_api.admin_delete_product, name='admin-delete-product'),
    path('quantri/categories-brands/', admin_api.admin_list_categories_brands, name='admin-list-categories-brands'),

    # ----------- API Quản trị đơn hàng ----------
    path('quantri/orders/', admin_api.admin_list_orders, name='admin-list-orders'),
    path('quantri/orders/<int:order_id>/', admin_api.admin_view_order, name='admin-view-order'),
    path('quantri/orders/<int:order_id>/update/', admin_api.admin_update_order_status, name='admin-update-order'),
    path('quantri/orders/<int:order_id>/delete/', admin_api.admin_delete_order, name='admin-delete-order'),
    path('quantri/orders/<int:order_id>/info/', admin_api.admin_order_info_basic, name='admin-order-info'),

    # ----------- API Quản trị đơn hàng ----------
    path('quantri/reviews/', admin_api.admin_list_reviews),
    path('quantri/reviews/<int:review_id>/', admin_api.admin_view_review),
    path('quantri/reviews/<int:review_id>/delete/', admin_api.admin_delete_review),
    path('quantri/reviews/<int:review_id>/reply/', admin_api.admin_reply_review),

    # ----------- Giao diện quản trị (HTML) ----------
    path('quantri/product/', views.admin_product_list, name='quantri-dashboard-products'),
    path('quantri/products/edit/<int:product_id>/', views.edit_product, name='quantri-edit-product'),
    path('quantri/products/delete/<int:product_id>/', views.delete_product, name='quantri-delete-product'),
    path('quantri/product/create/', views.create_product_page, name='quantri-create-product'),
    path('quantri/products/detail/<int:product_id>/', views.admin_product_detail_page, name='quantri-product-detail'),

    path('quantri/order/', views.manage_order, name='quantri-dashboard-order'),
    path('quantri/order/<int:order_id>/', views.order_detail_view, name='admin-order-detail'),

    path('quantri/review/', views.admin_review_list_view, name='quantri_review_list'),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
