from decimal import Decimal

from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.utils import timezone

from .upload_paths import ProcessingUploadPath


class User(AbstractUser):
    SEX_CHOICES = [
        ('male', 'Nam'),
        ('female', 'Nữ'),
        ('other', 'Khác'),
    ]
    phone = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    address = models.TextField()
    sex = models.CharField(max_length=50, choices=SEX_CHOICES, default='male')
    birthday = models.DateField(null=True, blank=True)


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
    created_at = models.DateTimeField(auto_now_add=True)
    slug = models.CharField(max_length=150, null=True, blank=True, unique=True)
    status = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} - {self.slug or 'None'}"


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    img = models.ImageField(
        upload_to=ProcessingUploadPath.product_image_upload_path,
        null=True,
        blank=True,
        help_text="Ảnh đại diện sản phẩm"
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)


class Option(models.Model):
    slug = models.CharField(max_length=150, null=True, blank=True)
    product = models.ForeignKey('Product', on_delete=models.CASCADE, help_text="Sản phẩm tương ứng",
                                related_name='options')
    version = models.CharField(max_length=150, null=True, blank=True, help_text="Tên phiên bản sản phẩm")
    discount = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=0,
                                   help_text="Phần trăm giảm giá")
    description = models.TextField(null=True, blank=True, help_text="Mô tả chi tiết phiên bản")
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, help_text="Ngày tạo bản ghi")
    updated_at = models.DateTimeField(auto_now=True, help_text="Ngày cập nhật gần nhất")
    is_active = models.BooleanField(default=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['product', 'slug'], name='unique_option_slug_per_product')
        ]


class OptionDetail(models.Model):
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
    is_active = models.BooleanField(default=True)


class OptionColor(models.Model):
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    color = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    stock = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    def final_price(self):
        discount = self.option.discount or 0
        return self.price * (Decimal('1.0') - discount)


class OptionImage(models.Model):
    option_color = models.ForeignKey(OptionColor, on_delete=models.CASCADE)
    img = models.ImageField(upload_to=ProcessingUploadPath.option_image_upload_path, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Image for {self.option_color} - {self.img.url if self.img else 'No image'}"


class Cart(models.Model):
    option_color = models.ForeignKey(OptionColor, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Review(models.Model):
    option_color = models.ForeignKey(OptionColor, on_delete=models.CASCADE, null=True, blank=True)
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)
    content = models.TextField()
    quality = models.TextField(null=True, blank=True)
    summary = models.TextField(null=True, blank=True)
    featureHighlight = models.TextField(null=True, blank=True)
    star_count = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ReviewReply(models.Model):
    review = models.OneToOneField(Review, on_delete=models.CASCADE)
    admin = models.ForeignKey(User, on_delete=models.CASCADE,
                              limit_choices_to={'is_staff': True})
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Order(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Chờ xác nhận'),
        ('processing', 'Đang xử lý'),
        ('shipping', 'Đang giao hàng'),
        ('shipped', 'Đã giao hàng'),
        ('cancelled', 'Đã hủy'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    need_invoice = models.BooleanField(default=False)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    total_price = models.DecimalField(max_digits=20, decimal_places=2, default=0)
    address = models.TextField(null=True, blank=True)
    has_review = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True, help_text="Ngày tạo bản ghi")
    update_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    pending_at = models.DateTimeField(null=True, blank=True)
    processing_at = models.DateTimeField(null=True, blank=True)
    shipping_at = models.DateTimeField(null=True, blank=True)
    shipped_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        # Nếu đơn hàng mới => set pending_at
        if not self.pk and self.status == 'pending':
            self.pending_at = timezone.now()
        else:
            # Đơn hàng đã tồn tại => kiểm tra thay đổi trạng thái
            old = Order.objects.get(pk=self.pk)
            if old.status != self.status:
                if self.status == 'processing':
                    self.processing_at = timezone.now()
                elif self.status == 'shipping':
                    self.shipping_at = timezone.now()
                elif self.status == 'shipped':
                    self.shipped_at = timezone.now()
                elif self.status == 'cancelled':
                    self.cancelled_at = timezone.now()
        super().save(*args, **kwargs)

    def calculate_total_price(self):
        total = Decimal('0.00')
        for item in self.order_items.all():
            item_total = item.total_price() or Decimal('0.00')
            total += item_total
        self.total_price = total
        self.save()


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="order_items")
    option_color = models.ForeignKey(OptionColor, on_delete=models.CASCADE, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)

    def total_price(self):
        return self.option_color.final_price() * self.quantity


class ReviewImage(models.Model):
    review = models.ForeignKey(Review, related_name='media_files', on_delete=models.CASCADE)
    img = models.ImageField(upload_to=ProcessingUploadPath.review_upload_path, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class OrderCancellation(models.Model):
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='cancellation')
    reason = models.TextField(null=True, blank=True, help_text="Lý do hủy đơn hàng")
    note = models.TextField(null=True, blank=True, help_text="Ghi chú nội bộ thêm khi hủy đơn hàng")
    cancelled_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                     help_text="Người thực hiện hủy đơn")
    cancelled_at = models.DateTimeField(auto_now_add=True)
