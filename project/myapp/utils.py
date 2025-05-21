import random
import threading
from datetime import datetime, timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Q


def send_order_confirmation_email(userInfo, order_details, total_price):
    order_text = "\n".join(order_details)
    total_price = "{:,.0f} ₫".format(total_price).replace(",", ".")
    email_body = f"""Xin chào {userInfo['first_name']} {userInfo['last_name']},

Cảm ơn bạn đã đặt hàng tại SmartBuy!

Thông tin đơn hàng: {order_text}

Tổng thanh toán: {total_price}
Giao đến: {userInfo['address_detail']}, {userInfo['ward']}, {userInfo['district']}, {userInfo['city']}

Chúng tôi sẽ liên hệ sớm với bạn để xác nhận đơn hàng.

Trân trọng,
SmartBuy"""
    send_mail(
        subject='[SmartBuy] Xác nhận đơn hàng của bạn',
        message=email_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[userInfo['email'].strip()],
        fail_silently=False,
    )


def send_otp(email, otp):
    email_body = f'''Mã xác thực OTP của bạn: {otp}
Vui lòng không gửi mã xác thực này cho ai
'''
    send_mail(
        subject='[SmartBuy] Mã xác thực tài khoản',
        message=email_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[email],
        fail_silently=False,
    )


def is_admin(user):
    return user.is_staff


def is_customer(user):
    return user.groups.filter(name='Customer').exists()


def get_filtered_products(category_slug, brand_slug):
    filters = Q()

    if category_slug:
        filters &= Q(category__slug__icontains=category_slug)

    if brand_slug:
        filters &= Q(brand__slug__icontains=brand_slug)

    return filters


class OtpService:
    @staticmethod
    def generate_otp(request):
        if OtpService.check_otp(request):
            return

        email = request.data.get('email')
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        expiry_time = (datetime.now() + timedelta(minutes=5)).timestamp()

        request.session['otp'] = otp
        request.session['otp_expiry'] = expiry_time

        threading.Thread(target=send_otp, args=(email, otp)).start()

    @staticmethod
    def delete_otp(request):
        request.session.pop('otp', None)
        request.session.pop('otp_expiry', None)

    @staticmethod
    def check_otp(request):
        otp = request.session.get('otp')
        otp_expiry = request.session.get('otp_expiry')
        if not otp or not otp_expiry:
            return False
        if datetime.now().timestamp() > otp_expiry:
            OtpService.delete_otp(request)
            return False
        return True

    @staticmethod
    def setOtpVerify(request, value):
        request.session['otp_verified'] = value

    @staticmethod
    def getOtpVerify(request):
        return request.session.get('otp_verified', False)


def serialize_product_with_option(option, selected_color=None, context=None):
    from .serializers import ProductSerializer, OptionSerializer, OptionColorSerializer  # moved here
    product = option.product

    option_data = OptionSerializer(option, context=context).data

    if selected_color:
        option_data['colors'] = OptionColorSerializer([selected_color], many=True, context=context).data
    else:
        option_data['colors'] = OptionColorSerializer(option.optioncolor_set.all(), many=True, context=context).data

    product_data = ProductSerializer(product, context=context).data
    product_data['options'] = [option_data]

    return product_data
