from django.conf import settings
from django.conf.urls.static import static
from django.urls import path

from . import api_views, admin_api
from . import views
from .admin_api import CreateProductView
from .api_views import homeApiView, infoUserApiView, searchApiView, orderApiView

urlpatterns = [
    path('api/home/get/', homeApiView.as_view(), name='api_home'),
    path('api/product/<str:slugCategory>/<str:slugProduct>/', api_views.apiProductDetail,
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
    path('api/get_total_product/', api_views.api_total_product, name='api_total_product'),

    path('login/', views.login, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register, name='register'),
    path('', views.home, name='home'),
    path('search/', views.search, name='search'),
    path('detail/<str:slugCategory>/<str:slugProduct>/', views.detail, name='detail_option'),
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
    # create_new_product page
    path('api/products/', admin_api.admin_list_products, name='admin-list-products'),
    path('api/products/create_post/', CreateProductView.as_view(), name='admin-get-product'),
    path('api/products/create_get/', CreateProductView.as_view(), name='admin-post-product'),
    path('api/add_category/', admin_api.admin_add_category, name='admin_add_category'),
    path('api/add_brand/', admin_api.admin_add_brand, name='admin_add_brand'),
    # product_detail page
    path('api/products/<int:product_id>/', admin_api.admin_product_detail, name='admin-product-detail'),
    path('api/products/update_product/<int:productId>/', admin_api.admin_api_update_product_detail,
         name='admin-update-product-detail'),
    # create_new_option
    path('api/products/update_option/<int:product_id>/', admin_api.admin_api_update_option,
         name='admin-create-option'),
    # update_old_option
    path('api/products/update_option/<int:product_id>/<int:option_id>/', admin_api.admin_api_update_option,
         name='admin-update-option'),
    # soft delete option at product_detail page
    path('api/products/delete_option/<int:option_id>/', admin_api.admin_api_delete_option, name='admin-option-delete'),
    # soft delete product at admin_product page
    path('api/products/delete/<int:product_id>/', admin_api.admin_api_delete_product, name='admin-product-delete'),
    path('api/products/restore_product/<int:product_id>/', admin_api.admin_api_restore_product,
         name='admin-restore-product'),

    # ----------- API Quản trị đơn hàng ----------
    path('api/orders/', admin_api.admin_list_orders, name='admin-list-orders'),
    path('api/orders/patch/', admin_api.api_admin_update_order_status, name='admin_update_order_status'),
    path('api/orders/<int:order_id>/', admin_api.admin_view_order, name='admin-view-order'),
    path('api/orders/cancel/<int:order_id>/', admin_api.admin_api_cancel_order, name='admin-cancel-order'),

    # ----------- API Quản trị đánh giá ----------
    path('api/reviews/', admin_api.admin_list_reviews, name='admin-list-reviews'),
    path('api/reviews/update/', admin_api.api_update_review_reply, name='update_review_reply'),

    # ----------- Giao diện quản trị (HTML) ----------
    path('quantri/products/', views.admin_product_list, name='admin-dashboard-products'),
    path('quantri/products/create/', views.create_product_page, name='admin-create-product-page'),
    path('quantri/products/detail/<int:product_id>/', views.edit_product, name='admin-edit-product'),

    path('quantri/orders/', views.manage_order, name='admin-dashboard-orders'),
    path('quantri/orders/<int:order_id>/', views.order_detail_view, name='admin-order-detail-page'),

    path('quantri/reviews/', views.admin_review_list_view, name='admin-review-list-page')
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
