from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class User(AbstractUser):
    phone = models.CharField(max_length=50)
    address = models.TextField()


class Category(models.Model):
    name = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.CharField(max_length=150, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.slug or 'None'}"


class Brand(models.Model):
    name = models.CharField(max_length=150)
    origin = models.CharField(max_length=150)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    slug = models.CharField(max_length=150, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.slug or 'None'}"


class Product(models.Model):
    name = models.CharField(max_length=150)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    purchased_count = models.PositiveIntegerField(default=0)
    img = models.URLField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    slug = models.CharField(max_length=150, null=True, blank=True)

    def __str__(self):
        return f"{self.name} - {self.slug or 'None'}"


class Option(models.Model):
    slug = models.CharField(max_length=150, null=True, blank=True)
    product = models.ForeignKey('Product', on_delete=models.CASCADE, help_text="Sản phẩm tương ứng")
    quantity = models.PositiveIntegerField(default=5);
    version = models.CharField(max_length=150, null=True, blank=True, help_text="Tên phiên bản sản phẩm")
    color = models.CharField(max_length=150, null=True, blank=True, help_text="Màu sắc sản phẩm")
    price = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True,
                                help_text="Giá gốc của sản phẩm")
    img = models.TextField(null=True, blank=True, help_text="Danh sách URL hình ảnh")

    # Các trường specs dạng JSON → lưu dưới dạng chuỗi (TextField)
    memory_and_storage = models.TextField(null=True, blank=True, help_text="Bộ nhớ & Lưu trữ")
    rear_camera = models.TextField(null=True, blank=True, help_text="Camera sau")
    front_camera = models.TextField(null=True, blank=True, help_text="Camera trước")
    os_and_cpu = models.TextField(null=True, blank=True, help_text="Hệ điều hành & CPU")
    connectivity = models.TextField(null=True, blank=True, help_text="Kết nối")
    display = models.TextField(null=True, blank=True, help_text="Màn hình")
    battery_and_charging = models.TextField(null=True, blank=True, help_text="Pin & Sạc")
    design_and_weight = models.TextField(null=True, blank=True, help_text="Thiết kế & Trọng lượng")
    general_information = models.TextField(null=True, blank=True, help_text="Thông tin chung")
    utilities = models.TextField(null=True, blank=True, help_text="Tiện ích")
    product_overview = models.TextField(null=True, blank=True, help_text="Tổng quan sản phẩm")

    warranty = models.CharField(max_length=150, null=True, blank=True, help_text="Thông tin bảo hành")
    discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True,
                                   help_text="Phần trăm giảm giá")
    promotion_start_date = models.DateTimeField(null=True, blank=True, help_text="Ngày bắt đầu khuyến mãi")
    promotion_end_date = models.DateTimeField(null=True, blank=True, help_text="Ngày kết thúc khuyến mãi")
    promotion_description = models.TextField(null=True, blank=True, help_text="Mô tả khuyến mãi")

    description = models.TextField(null=True, blank=True, help_text="Mô tả chi tiết phiên bản")
    created_at = models.DateTimeField(null=True, blank=True, help_text="Ngày tạo bản ghi")
    updated_at = models.DateTimeField(auto_now=True, help_text="Ngày cập nhật gần nhất")

    def final_price(self):
        if self.discount:
            return self.price * (1 - self.discount / 100)
        return self.price

    def __str__(self):
        return f"{self.product.name} - {self.version or ''} - {self.color or ''} - {self.slug or 'None'}"


class Cart(models.Model):
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def total_price(self):
        return self.option.price * self.quantity


class Purchased(models.Model):
    option = models.ForeignKey(Option, on_delete=models.DO_NOTHING)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date_purchased = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    content = models.TextField()
    star_count = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ReviewReply(models.Model):
    review = models.OneToOneField(Review, on_delete=models.CASCADE)  # Mỗi đánh giá chỉ có 1 phản hồi
    admin = models.ForeignKey(User, on_delete=models.CASCADE,
                              limit_choices_to={'is_staff': True})  # Chỉ admin mới có thể phản hồi
    content = models.TextField()  # Nội dung phản hồi
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('processing', 'Đang xử lý'),
        ('shipped', 'Đã giao hàng'),
        ('cancelled', 'Đã hủy'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
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
