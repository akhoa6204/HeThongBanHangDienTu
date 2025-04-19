from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Product, Option, Category, Brand
from .serializers import ProductSerializer, OptionSerializer, CategorySerializer, BrandSerializer, AllOptionSerializer


@api_view(['GET'])
def apiProduct(request, slugCategory, slugProduct, slugOption):
    product = Product.objects.get(slug=slugProduct)
    all_options = Option.objects.filter(product_id=product.id)
    current_options = Option.objects.filter(product_id=product.id, slug=slugOption)
    brand = Brand.objects.get(id=product.brand_id)
    category = Category.objects.get(slug=slugCategory)

    product_serialized = ProductSerializer(product)
    all_options_serialized = AllOptionSerializer(all_options, many=True)
    current_options_serialized = OptionSerializer(current_options, many=True)
    category_serialized = CategorySerializer(category)
    brand_serialized = BrandSerializer(brand)

    current_options_data = current_options_serialized.data
    for option in current_options_data:
        imgList = [img.strip(';').strip() for img in option['img'].split(',')]
        option['img'] = imgList
    all_options_data = all_options_serialized.data
    seen_slugs = set()
    filtered_options = []

    for item in all_options_data:
        if item['slug'] not in seen_slugs:
            seen_slugs.add(item['slug'])
            filtered_options.append(item)

    return Response({
        "category": category_serialized.data,
        'brand': brand_serialized.data,
        "product": product_serialized.data,
        "current_options": current_options_data,
        "all_options": filtered_options,
    })
