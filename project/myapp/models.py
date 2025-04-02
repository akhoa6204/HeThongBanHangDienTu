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
    description=models.TextField()
    star_count = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

# class Payment(models.Model):


