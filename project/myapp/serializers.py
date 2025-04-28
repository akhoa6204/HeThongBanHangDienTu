from rest_framework import serializers

from .models import Product, Option, Category, Brand, Review, ReviewReply, User, Cart, OrderItem, Order


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'email', 'address']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name', 'slug']


class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer()

    class Meta:
        model = Product
        fields = ['name', 'slug', 'purchased_count', 'img', 'category']


class OptionSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = Option
        fields = ['slug', 'quantity', 'version', 'color', 'price', 'img', 'memory_and_storage', 'rear_camera',
                  'os_and_cpu', 'display', 'discount', 'description', 'product']


class OptionReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['color', 'version']


class AllOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['slug', 'version']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'img']


class OptionForProductSerializer(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = Option
        fields = ['slug', 'quantity', 'version', 'color', 'price', 'img',
                  'memory_and_storage', 'rear_camera',
                  'os_and_cpu', 'display', 'discount', 'description',
                  'product']


class ReviewReplySerializer(serializers.ModelSerializer):
    class Meta:
        model = ReviewReply
        fields = ['admin', 'content']


class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer()
    option = OptionReviewSerializer()
    reviewReply = ReviewReplySerializer(source='reviewreply')

    class Meta:
        model = Review
        fields = ['content', 'star_count', 'user', 'created_at', 'quality', 'summary', 'featureHighlight', 'img',
                  'option', 'reviewReply']


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['name', 'slug']


class OptionForProduct(serializers.ModelSerializer):
    product = ProductSerializer()

    class Meta:
        model = Option
        fields = ['version', 'price', 'discount', 'product', 'slug']


class OptionForCategory(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['name', 'slug', 'options']

    def get_options(self, obj):
        products = Product.objects.filter(category=obj).order_by('-purchased_count')[:10]
        options = []
        for product in products:
            top_option = Option.objects.filter(product=product).order_by('-price').first()
            if top_option:
                options.append(top_option)
        return OptionForProduct(options, many=True).data


class OptionsForProduct(serializers.ModelSerializer):
    options = serializers.SerializerMethodField()
    category = CategorySerializer()

    class Meta:
        model = Product
        fields = ['name', 'slug', 'img', 'category', 'options', ]  # Có thể thêm tên, slug... nếu cần

    def get_options(self, obj):
        options = Option.objects.filter(product=obj)
        return OptionSerializer(options, many=True).data


class CartSerializer(serializers.ModelSerializer):
    option = OptionSerializer()

    class Meta:
        model = Cart
        fields = ['id', 'option', 'quantity']


class OrderItemSerializer(serializers.ModelSerializer):
    option = OptionSerializer()

    class Meta:
        model = OrderItem
        fields = '__all__'


class OrderSerializer(serializers.ModelSerializer):
    orderItem = OrderItemSerializer(many=True, source='order_items')

    class Meta:
        model = Order
        fields = ['status', 'total_price', 'updated_at', 'orderItem']
