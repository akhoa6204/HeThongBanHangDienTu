from telnetlib import CHARSET

from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

class User(AbstractUser):
    phone=models.CharField(max_length=50)
    address=models.TextField()

class Category(models.Model):
    name=models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Brand(models.Model):
    name=models.CharField(max_length=150)
    nation=models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Product(models.Model):
    name=models.CharField(max_length=150)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    category =models.ForeignKey(Category, on_delete=models.CASCADE)
    purchased_count = models.PositiveIntegerField(default=0)
    description = models.TextField(null=True, blank=True)  # Mô tả sản phẩm chi tiết
    img = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Option(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    color = models.CharField(max_length=150, null=True, blank=True)  # Màu sắc
    ram = models.CharField(max_length=150, null=True, blank=True)  # Dung lượng RAM
    rom = models.CharField(max_length=150, null=True, blank=True)  # Dung lượng ROM
    screen_size = models.CharField(max_length=50, null=True, blank=True)  # Kích thước màn hình
    battery = models.CharField(max_length=50, null=True, blank=True)  # Dung lượng pin
    chipset = models.CharField(max_length=150, null=True, blank=True)  # Chip xử lý
    camera = models.CharField(max_length=150, null=True, blank=True)  # Thông số camera
    os = models.CharField(max_length=150, null=True, blank=True)  # Hệ điều hành
    charging_type = models.CharField(max_length=150, null=True, blank=True)  # Loại cáp sạc
    warranty = models.CharField(max_length=150, null=True, blank=True)  # Bảo hành
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Giá
    updated_at = models.DateTimeField(auto_now=True)
    img = models.URLField(null=True, blank=True)

    discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)  # Giảm giá (ví dụ: 10%)
    promotion_start_date = models.DateTimeField(null=True, blank=True)  # Ngày bắt đầu khuyến mãi
    promotion_end_date = models.DateTimeField(null=True, blank=True)  # Ngày kết thúc khuyến mãi
    promotion_description = models.TextField(null=True, blank=True)  # Mô tả chương trình khuyến mãi

    def final_price(self):
        if self.discount:  # Kiểm tra nếu có giảm giá
            return self.price * (1 - self.discount / 100)  # Giảm giá theo phần trăm
        return self.price  # Nếu không có giảm giá, trả về giá gốc

class Cart(models.Model):
    option =models.ForeignKey(Option, on_delete=models.CASCADE)
    user=models.ForeignKey(User, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def total_price(self):
        return self.option.price * self.quantity

class Purchased(models.Model):
    option =models.ForeignKey(Option, on_delete=models.DO_NOTHING)
    user=models.ForeignKey(User, on_delete=models.CASCADE)
    date_purchased=models.DateTimeField(auto_now_add=True)

class Review(models.Model):
    product=models.ForeignKey(Product, on_delete=models.CASCADE)
    user=models.ForeignKey(User, on_delete=models.DO_NOTHING)
    content=models.TextField()
    star_count = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ReviewReply(models.Model):
    review = models.OneToOneField(Review, on_delete=models.CASCADE)  # Mỗi đánh giá chỉ có 1 phản hồi
    admin = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'is_staff': True})  # Chỉ admin mới có thể phản hồi
    content = models.TextField()  # Nội dung phản hồi
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Order(models.Model):
    STATUS_CHOICES=[
        ('pending', 'Chờ xác nhận'),
        ('processing', 'Đang xử lý'),
        ('shipped', 'Đã giao hàng'),
        ('cancelled', 'Đã hủy'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status =models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def calculate_total_price(self):
        total = sum(item.total_price() for item in self.order_items.all())
        self.total_price = total
        self.save()

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def total_price(self):
        return self.option.final_price() * self.quantity

# class Payment(models.Model):


