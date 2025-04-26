import threading

from django.db.models import Avg, Exists, OuterRef
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response

from .models import Option, Category, Brand, ReviewReply, Cart, Order, OrderItem
from .models import Product, Review
from .serializers import ProductSerializer, OptionSerializer, CategorySerializer, BrandSerializer, AllOptionSerializer, \
    OptionForCategory, OptionForProductSerializer, CartSerializer
from .serializers import ReviewSerializer
from .utils import send_order_confirmation_email


@api_view(['GET'])
@permission_classes([AllowAny])
def apiHome(request):
    categories = Category.objects.all()
    category_serialized = OptionForCategory(categories, many=True)

    return Response(category_serialized.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def apiProductDetail(request, slugCategory, slugProduct, slugOption):
    try:
        product = Product.objects.get(slug=slugProduct)
        category = Category.objects.get(slug=slugCategory)
        brand = Brand.objects.get(id=product.brand_id)
    except (Product.DoesNotExist, Category.DoesNotExist, Brand.DoesNotExist):
        return Response({"error": "Product, Category, or Brand not found"}, status=404)

    all_options = Option.objects.filter(product_id=product.id)
    current_options = Option.objects.filter(product_id=product.id, slug=slugOption)

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


@api_view(['GET'])
@permission_classes([AllowAny])
def apiReviews(request, slugProduct, star, numberPage):
    product = Product.objects.get(slug=slugProduct)
    reviews = None
    if star > 0 and star < 6:
        reviews = Review.objects.filter(product=product, star_count=star).select_related('user', 'option')
    elif star == 0:
        reviews = Review.objects.filter(product=product).select_related('user', 'option')
    elif star == 6:
        reviews = Review.objects.filter(product=product, img__isnull=False).select_related('user', 'option')
        print(reviews)
    elif star == 7:
        reviews = Review.objects.annotate(
            has_reply=Exists(
                ReviewReply.objects.filter(review=OuterRef('pk'))
            )
        ).filter(product=product, has_reply=True).select_related('user', 'option')
    avg = reviews.aggregate(average=Avg('star_count'))['average'] or 0
    avg = round(avg, 1)

    reviews_per_page = 3

    page_number = int(numberPage) if numberPage else 1

    start_index = (page_number - 1) * reviews_per_page
    end_index = start_index + reviews_per_page

    paginated_reviews = reviews[start_index:end_index]

    reviews_serialized = ReviewSerializer(paginated_reviews, many=True)
    for review in reviews_serialized.data:
        if review['img']:
            imgList = [img.strip(';').strip() for img in review['img'].split(',')]
        else:
            imgList = None
        review['img'] = imgList
    total_reviews = reviews.count() if reviews else 0
    total_pages = (total_reviews // reviews_per_page) + (
        1 if total_reviews % reviews_per_page != 0 else 0) if total_reviews > 0 else 0

    return Response({
        "reviews": reviews_serialized.data,
        "page": page_number,
        "total_pages": total_pages,
        "avg": avg,
        "total_reviews": total_reviews
    })


@api_view(['GET'])
@permission_classes([AllowAny])
def apiSearch(request, slugSearch, numberPage):
    products = Product.objects.filter(slug__icontains=slugSearch)

    if not products.exists():
        category = Category.objects.filter(slug__icontains=slugSearch).first()
        if category:
            products = Product.objects.filter(category=category)

    options = Option.objects.filter(product__in=products).select_related('product')

    # Lọc option trùng product + version
    seen = set()
    unique_options = []
    for option in options:
        key = (option.product_id, option.version)
        if key not in seen:
            seen.add(key)
            unique_options.append(option)

    # Serialize
    options_serialized = OptionForProductSerializer(unique_options, many=True).data

    # Xử lý ảnh
    for option in options_serialized:
        option['img'] = [img.strip() for img in option.get('img', '').split(',') if img.strip()]
        if option.get('product') and option['product'].get('img'):
            option['product']['img'] = [img.strip() for img in option['product']['img'].split(',') if img.strip()]

    # Pagination
    products_per_page = 12
    total_products = len(options_serialized)
    start_index = (numberPage - 1) * products_per_page
    end_index = start_index + products_per_page
    paginated_options = options_serialized[start_index:end_index]
    total_pages = (total_products // products_per_page) + (
        1 if total_products % products_per_page != 0 else 0) if total_products > 0 else 0
    return Response({
        'products': paginated_options,
        'totalProducts': total_products,
        'totalPages': total_pages
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def apiOrder(request):
    user = request.user
    user_final = {
        "first_name": user.first_name,
        'last_name': user.last_name,
        'phone': user.phone,
        'email': user.email,
        'address': user.address if user.address else "",
    }
    order_items = request.session.get('orderInfo', None)
    results = []
    for item in order_items:
        slugProduct = item.get('slugProduct')
        slugOption = item.get('slugOption')
        color = item.get('color')
        quantity = item.get('quantity')
        try:
            product = Product.objects.get(slug=slugProduct)
            option = Option.objects.get(product=product, slug=slugOption, color=color)

            option_serializer = OptionSerializer(option)
            data = option_serializer.data

            if data.get('img'):
                data['img'] = [img.strip(';').strip() for img in data['img'].split(',')]

            if data.get('product') and data['product'].get('img'):
                data['product']['img'] = [img.strip(';').strip() for img in data['product']['img'].split(',')]

            data['quantity'] = quantity

            results.append(data)
        except Exception as e:
            results.append({'error': str(e), 'slugProduct': slugProduct})

    return Response({
        "options": results,
        'user': user_final
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_product_cart(request):
    product_data = request.data
    user = request.user
    product = Product.objects.get(slug=product_data.get('slugProduct'))
    option = Option.objects.get(product_id=product.id, slug=product_data.get('slugOption'),
                                color=product_data.get('color'))

    if Cart.objects.filter(option=option, user=user).exists():
        return Response({"detail": "Sản phẩm đã tồn tại trong giỏ hàng."}, status=status.HTTP_400_BAD_REQUEST)

    quantity = product_data.get('quantity', 1)
    cart = Cart.objects.create(option=option, user=user, quantity=quantity)
    return Response({"detail": "Sản phẩm đã được thêm vào giỏ hàng."}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_cart(request):
    user = request.user
    cart = Cart.objects.filter(user=user)
    cart_serializer = CartSerializer(cart, many=True)
    total = 0
    for item in cart_serializer.data:
        item['option']['img'] = [img.strip(';') for img in item['option']['img'].split(',')]
    return Response({
        'cart': cart_serializer.data,
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def api_cart_remove_item(request):
    user = request.user
    for item in request.data:
        product = Product.objects.get(name=item['nameProduct'])
        option = Option.objects.get(product=product, version=item['version'], color=item['color'])
        cart = Cart.objects.get(user=user, option=option)
        cart.delete()
    return Response({"detail": 'Xóa sản phẩm thành công'}, status=status.HTTP_200_OK)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def api_cart_update_quantity_item(request):
    user = request.user
    item = request.data
    product = Product.objects.get(name=item['nameProduct'])
    option = Option.objects.get(product=product, version=item['version'], color=item['color'])
    cart = Cart.objects.get(user=user, option=option)
    cart.quantity = item['quantity']
    cart.save()
    return Response({"detail": 'Cập nhật sản phẩm thành công'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_order_product(request):
    order_info = request.data

    request.session['orderInfo'] = order_info

    return Response({"detail": "Order information has been saved."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_order_user(request):
    orderSummary = request.data
    request.session['userInfo'] = orderSummary.get('userInfo')
    request.session['bill'] = orderSummary.get('bill')
    return Response(status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_payment(request):
    userInfo = request.session.get('userInfo', None)
    bill = request.session.get('bill', None)
    orderInfo = request.session.get('orderInfo', None)
    return Response({
        'userInfo': userInfo,
        'bill': bill,
        'orderInfo': orderInfo

    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_successOrder(request):
    user = request.user
    userInfo = request.session.get('userInfo')
    orderItemList = request.session.get('orderInfo')

    order = Order.objects.create(user=user, status='pending')

    order_details = []  # để gom chi tiết đơn hàng gửi trong email

    for item in orderItemList:
        print(item)
        product = Product.objects.get(slug=item['slugProduct'])
        option = Option.objects.get(product=product, slug=item['slugOption'], color=item['color'])
        OrderItem.objects.create(order=order, option=option, quantity=item['quantity'])

        order_details.append(f"{product.name} ({option.version}, {option.color}) x {item['quantity']}")
    for item in order.order_items.all():
        print(item.option.price, item.option.discount, item.total_price())
    # Tính tổng tiền
    order.calculate_total_price()
    total_price = order.total_price

    threading.Thread(
        target=send_order_confirmation_email,
        args=(userInfo, order_details, total_price)
    ).start()

    return Response({"detail": "Đặt hàng thành công", "order_id": order.id}, status=200)


@api_view(['GET'])
def api_authenticated(request):
    if request.user.is_authenticated:
        user = request.user
        first_name = user.first_name
        last_name = user.last_name
        return Response({"is_authenticated": True, "user": {
            'name': first_name + ' ' + last_name
        }}, status=200)
    else:
        return Response({"is_authenticated": False}, status=401)
