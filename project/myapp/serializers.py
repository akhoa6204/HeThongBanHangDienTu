from rest_framework import serializers

from .models import Product, Option, Category, Brand, Review, ReviewReply, User, Cart, OrderItem, Order, OptionDetail, \
    OptionColor, OptionImage, ProductImage, ReviewImage
from .utils import serialize_product_with_option


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'email', 'address']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['id', 'name', 'origin', 'slug']


class OptionDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = OptionDetail
        fields = ['name', 'value']


class OptionImageSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()

    class Meta:
        model = OptionImage
        fields = ['img']

    def get_img(self, obj):
        request = self.context.get('request')
        if obj.img and request:
            return request.build_absolute_uri(obj.img.url)
        return None


class OptionColorSerializer(serializers.ModelSerializer):
    images = OptionImageSerializer(many=True, source='optionimage_set')

    class Meta:
        model = OptionColor
        fields = ['color', 'price', 'stock', 'images']


class OptionSerializer(serializers.ModelSerializer):
    colors = OptionColorSerializer(many=True, source='optioncolor_set')
    details = OptionDetailSerializer(many=True, source='optiondetail_set')

    class Meta:
        model = Option
        fields = ['slug', 'version', 'discount', 'description', 'colors', 'details']


class ProductImageSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ['img']

    def get_img(self, obj):
        request = self.context.get('request')
        if obj.img and request:
            return request.build_absolute_uri(obj.img.url)
        return None


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer()
    brand = BrandSerializer()
    options = OptionSerializer(many=True)
    images = ProductImageSerializer(many=True, source='productimage_set')

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'category', 'brand', 'purchased_count', 'options', 'images']


class OptionReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['color', 'version']


class OptionSearchSerializer(serializers.Serializer):
    product = serializers.SerializerMethodField()

    def get_product(self, option):
        selected_color = option.optioncolor_set.order_by('-price').first()
        return serialize_product_with_option(option, selected_color=selected_color, context=self.context)


class ReviewImageSerializer(serializers.ModelSerializer):
    img = serializers.SerializerMethodField()

    class Meta:
        model = ReviewImage
        fields = ['img']

    def get_img(self, obj):
        request = self.context.get('request')
        if obj.img and request:
            return request.build_absolute_uri(obj.img.url)
        return None


class ReviewReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewReply
        fields = ['admin', 'content']


class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    product = serializers.SerializerMethodField()
    reviewReply = ReviewReplySerializer(source='reviewreply')
    media = ReviewImageSerializer(many=True, source='media_files')

    class Meta:
        model = Review
        fields = ['id', 'content', 'star_count', 'user', 'created_at', 'quality', 'summary', 'featureHighlight',
                  'product', 'reviewReply', 'media']

    def get_user(self, obj):
        return {
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "phone": obj.user.phone,
            "email": obj.user.email,
            "address": obj.user.address,
        }

    def get_product(self, obj):
        option = obj.option_color.option
        selected_color = obj.option_color
        return serialize_product_with_option(option, selected_color=selected_color, context=self.context)


class ProductThumbnailSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ['id', 'name', 'slug', 'image']

    def get_image(self, obj):
        request = self.context.get('request')
        product_image = obj.productimage_set.first()
        if product_image and product_image.img:
            return request.build_absolute_uri(product_image.img.url) if request else product_image.img.url
        return None


class OptionSummarySerializer(serializers.ModelSerializer):
    product = ProductThumbnailSerializer()
    top_price = serializers.SerializerMethodField()

    class Meta:
        model = Option
        fields = ['slug', 'version', 'discount', 'top_price', 'product']

    def get_top_price(self, obj):
        top_color = obj.optioncolor_set.order_by('-price').first()
        return top_color.price if top_color else None


class CategoryWithOptionsSerializer(serializers.ModelSerializer):
    top_options = serializers.SerializerMethodField()
    brands = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['name', 'slug', 'top_options', 'brands']

    def get_brands(self, obj):
        brands = Brand.objects.filter(product__category=obj).distinct()
        return BrandSerializer(brands, many=True).data

    def get_top_options(self, obj):
        products = Product.objects.filter(category=obj).order_by('-purchased_count')[:10]
        selected_options = []

        for product in products:
            options = product.options.all()
            best_option = None
            best_price = -1

            for option in options:
                top_color = option.optioncolor_set.order_by('-price').first()
                if top_color and top_color.price > best_price:
                    best_price = top_color.price
                    best_option = option

            if best_option:
                selected_options.append(best_option)

        return OptionSummarySerializer(selected_options, many=True, context=self.context).data


class CartSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ['id', 'product', 'quantity']

    def get_product(self, obj):
        option = obj.option_color.option
        selected_color = obj.option_color
        return serialize_product_with_option(option, selected_color=selected_color, context=self.context)


class OrderItemSerializer(serializers.ModelSerializer):
    product = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = ['id', 'quantity', 'product']

    def get_product(self, obj):
        option = obj.option_color.option
        selected_color = obj.option_color
        return serialize_product_with_option(option, selected_color=selected_color, context=self.context)


class OrderSerializer(serializers.ModelSerializer):
    orderItem = serializers.SerializerMethodField()
    user = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'need_invoice', 'status', 'total_price', 'updated_at', 'orderItem', 'has_review', 'address',
                  'user']

    def get_user(self, obj):
        return {
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "phone": obj.user.phone,
            "email": obj.user.email,
            "address": obj.user.address,
        }

    def get_orderItem(self, obj):
        return OrderItemSerializer(obj.order_items.all(), many=True, context=self.context).data


class OrderWithAdminSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'created_at']

    def get_user(self, obj):
        return {
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "phone": obj.user.phone,
            "email": obj.user.email,
            "address": obj.user.address,
        }


class ReviewWithAdminSerializer(serializers.ModelSerializer):
    review_reply = ReviewReplySerializer()

    class Meta:
        model = Review
        fields = ['review_reply']


class OrderWithItemsForAdminSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    order_items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'user', 'status', 'created_at', 'order_items', 'need_invoice', 'total_price', 'address']

    def get_user(self, obj):
        return {
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
            "phone": obj.user.phone,
            "email": obj.user.email,
            "address": obj.user.address,
        }
