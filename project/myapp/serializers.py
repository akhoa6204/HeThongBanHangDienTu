from rest_framework import serializers

from .models import Product, Option, Category, Brand, Review


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['slug', 'quantity', 'version', 'color', 'price', 'img', 'memory_and_storage', 'rear_camera',
                  'os_and_cpu', 'display', 'discount', 'description']


class AllOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = ['slug', 'version']


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ['name', 'slug', 'purchased_count', 'img']


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['name', 'slug']


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'


class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = ['name', 'slug']
