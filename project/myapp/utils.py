import random
import threading
from datetime import datetime, timedelta

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


import os
import re
import unicodedata
import uuid
from django.conf import settings


class ProcessingUploadPath:
    @staticmethod
    def processingColor(color):
        if not color:
            return "default-color"
        color = unicodedata.normalize('NFD', color)
        color = color.encode('ascii', 'ignore').decode('utf-8')
        color = re.sub(r'\s+', '-', color.lower())
        return color

    @staticmethod
    def ensure_folder_exists(path):
        if not os.path.exists(path):
            os.makedirs(path)

    @staticmethod
    def option_image_upload_path(instance, filename):
        product_slug = instance.option.product.slug or f"product-{instance.option.product.id}"
        version = instance.option.slug or "default-version"
        color = ProcessingUploadPath.processingColor(instance.option.color)
        ext = os.path.splitext(filename)[1]

        folder_path = os.path.join(settings.MEDIA_ROOT, f"products/{product_slug}/options/{version}")
        ProcessingUploadPath.ensure_folder_exists(folder_path)

        existing_files = [f for f in os.listdir(folder_path) if f.startswith(f"{version}_{color}")]
        count = len(existing_files) + 1

        filename = f"{version}_{color}_{count}{ext}"
        return f"products/{product_slug}/options/{version}/{filename}"

    @staticmethod
    def product_image_upload_path(instance, filename):
        ext = os.path.splitext(filename)[1]
        slug_or_id = instance.product.slug or str(instance.id)
        folder_path = os.path.join(settings.MEDIA_ROOT, f"products/{slug_or_id}/product")
        ProcessingUploadPath.ensure_folder_exists(folder_path)

        filename = f"{slug_or_id}{ext}"
        return f"products/{slug_or_id}/product/{filename}"

    @staticmethod
    def review_upload_path(instance, filename):
        ext = os.path.splitext(filename)[1]
        product_slug = instance.review.option.product.slug
        folder_path = os.path.join(settings.MEDIA_ROOT, f"reviews/{product_slug}")
        ProcessingUploadPath.ensure_folder_exists(folder_path)

        base_filename = str(uuid.uuid4())
        filename = f"{base_filename}{ext}"
        return f"reviews/{product_slug}/{filename}"
