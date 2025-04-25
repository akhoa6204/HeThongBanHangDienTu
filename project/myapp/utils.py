from django.conf import settings
from django.core.mail import send_mail


def send_order_confirmation_email(customer_email, order_details):
    subject = 'Thông tin đơn hàng'
    message = f'Cảm ơn bạn đã đặt hàng! Đây là thông tin đơn hàng của bạn: {order_details}'
    from_email = settings.EMAIL_HOST_USER

    send_mail(subject, message, from_email, [customer_email])
