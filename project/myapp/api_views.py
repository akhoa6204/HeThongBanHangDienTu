from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Product, Option, Category
from .serializers import ProductSerializer, OptionSerializer, CategorySerializer


@api_view(['GET'])
def apiProduct(request, idProduct):
    try:
        product = Product.objects.get(id=idProduct)
        options = Option.objects.filter(product_id=idProduct)
        category = Category.objects.all()

        product_serialized = ProductSerializer(product)
        options_serialized = OptionSerializer(options, many=True)
        category_serialized = CategorySerializer(category, many=True)

        return Response({
            "category": category_serialized.data,
            "product": product_serialized.data,
            "options": options_serialized.data
        })
    except Product.DoesNotExist:
        return Response({"error": "Product not found"}, status=404)
