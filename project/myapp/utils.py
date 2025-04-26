from django.conf import settings
from django.core.mail import send_mail


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
    # Gửi email
    send_mail(
        subject='[SmartBuy] Xác nhận đơn hàng của bạn',
        message=email_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[userInfo['email'].strip()],
        fail_silently=False,
    )
