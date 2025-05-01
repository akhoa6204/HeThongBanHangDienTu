import threading

from django.db.models import Avg, Exists, OuterRef, Count
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Option, Category, Brand, ReviewReply, Cart, MediaFile
from .models import Order, Review
from .models import OrderItem
from .models import Product
from .serializers import ProductSerializer, OptionSerializer, CategorySerializer, BrandSerializer, AllOptionSerializer, \
    OptionForCategory, OptionForProductSerializer, CartSerializer, OrderSerializer, OrderItemSerializer
from .serializers import ReviewSerializer
from .utils import send_order_confirmation_email


@permission_classes([AllowAny])
class homeApiView(APIView):
    def get(self, request):
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

    if 0 < star < 6:
        reviews = Review.objects.filter(option__product=product, star_count=star).select_related('user', 'option')
    elif star == 0:
        reviews = Review.objects.filter(option__product=product).select_related('user', 'option')
    elif star == 6:
        reviews = Review.objects.filter(
            option__product=product
        ).annotate(
            media_count=Count('media_files')
        ).filter(
            media_count__gt=0
        ).select_related('user', 'option')
    elif star == 7:
        reviews = Review.objects.annotate(
            has_reply=Exists(
                ReviewReply.objects.filter(review=OuterRef('pk'))
            )
        ).filter(option__product=product, has_reply=True).select_related('user', 'option')

    avg = reviews.aggregate(average=Avg('star_count'))['average'] or 0
    avg = round(avg, 1)

    reviews_per_page = 3
    page_number = int(numberPage) if numberPage else 1

    start_index = (page_number - 1) * reviews_per_page
    end_index = start_index + reviews_per_page
    paginated_reviews = reviews[start_index:end_index]

    reviews_serialized = ReviewSerializer(paginated_reviews, many=True)
    for review in reviews_serialized.data:
        if review.get('img'):
            imgList = [img.strip(';').strip() for img in review['img'].split(',')]
        else:
            imgList = None
        review['img'] = imgList

    total_reviews = reviews.count()
    total_pages = (total_reviews + reviews_per_page - 1) // reviews_per_page  # ceil logic

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
    sort_query = request.GET.get('sort', None)

    products = Product.objects.filter(slug__icontains=slugSearch)

    if not products.exists():
        category = Category.objects.filter(slug__icontains=slugSearch).first()
        if category:
            products = Product.objects.filter(category=category)

    options = Option.objects.filter(product__in=products).select_related('product')
    if sort_query == 'increase':
        options = options.order_by('price')
    elif sort_query == 'decrease':
        options = options.order_by('-price')

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
    products_per_page = 15
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
    if not order_items:
        return Response({"error": "No order information found in session."}, status=400)
    results = []
    for item in order_items:
        slugProduct = item.get('slugProduct')
        slugOption = item.get('slugOption')
        color = item.get('color')
        quantity = item.get('quantity')
        try:
            product = Product.objects.get(slug=slugProduct)
            options = Option.objects.filter(
                product=product,
                slug=slugOption,
                color=color,
                quantity__gt=0
            )
            if not options.exists():
                results.append({'error': f"No available option for product {slugProduct} with color {color}"})
                continue
            option = options.first()
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
    if len(results) == 1 and results[0].get('error'):
        request.session.pop('orderInfo', None)
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
    for item in cart_serializer.data:
        if item['quantity'] > item['option']['quantity']:
            if item['option']['quantity'] == 0:
                Cart.objects.filter(user=user, id=item['id']).delete()
                cart = Cart.objects.filter(user=user)
                cart_serializer = CartSerializer(cart, many=True)
            else:
                item['quantity'] = item['option']['quantity']
                cart_item = Cart.objects.get(user=user, id=item['id'])
                cart_item.quantity = item['quantity']
                cart_item.save()

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
    if not userInfo or not bill or not orderInfo:
        return Response(status=status.HTTP_400_BAD_REQUEST)

    return Response({
        'userInfo': userInfo,
        'bill': bill,
        'orderInfo': orderInfo
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_successOrder(request):
    user = request.user
    userInfo = request.session.get('userInfo')
    orderItemList = request.session.get('orderInfo')

    order = Order.objects.create(
        user=user,
        status='pending',
        address=f"{userInfo.get('address_detail')}, {userInfo.get('ward')}, {userInfo.get('district')}, {userInfo.get('city')}"
    )

    order_details = []

    for item in orderItemList:
        product = Product.objects.get(slug=item['slugProduct'])
        option = Option.objects.get(product=product, slug=item['slugOption'], color=item['color'])

        if option.quantity < int(item['quantity']):
            print(f"Sản phẩm {product.name} ({option.version} - {option.color} - {option.quantity}) không đủ hàng.")
            return Response({"detail": f"Sản phẩm {product.name} ({option.version} - {option.color}) không đủ hàng."},
                            status=400)

        OrderItem.objects.create(order=order, option=option, quantity=item['quantity'])
        option.quantity -= int(item['quantity'])
        product.purchased_count += int(item['quantity'])
        product.save()
        option.save()
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

    request.session.pop('userInfo', None)
    request.session.pop('orderInfo', None)
    request.session.pop('bill', None)

    return Response({"detail": "Đặt hàng thành công", "order_id": order.id}, status=200)


@api_view(['GET'])
def api_authenticated(request):
    return Response({"is_authenticated": request.user.is_authenticated})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_purchase(request, status, page=1):
    user = request.user
    if status == 'all':
        order = Order.objects.filter(user=user)
    else:
        order = Order.objects.filter(user=user, status=status)
    order_per_page = 5

    start_index = (page - 1) * order_per_page
    end_index = start_index + order_per_page

    paginated_orders = order[start_index:end_index]

    order_serializer = OrderSerializer(paginated_orders, many=True)

    for item in order_serializer.data:
        for orderItem in item['orderItem']:
            imgList = [img.strip() for img in orderItem['option']['img'].split(',')]
            orderItem['option']['img'] = imgList

    return Response({
        'order': order_serializer.data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_review(request, idOrder):
    user = request.user
    order = Order.objects.get(id=idOrder)
    if order.user != user:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    if order.status != 'shipped':
        return Response(status=status.HTTP_400_BAD_REQUEST)
    orderItems = OrderItem.objects.filter(order=order)
    orderItem_serializer = OrderItemSerializer(orderItems, many=True)
    for item in orderItem_serializer.data:
        imgList = [img.strip(';').strip() for img in item['option']['img'].split(',')]
        item['option']['img'] = imgList
    return Response(orderItem_serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_add_new_review(request, idOrder):
    user = request.user
    data = request.data

    try:
        order = Order.objects.get(id=idOrder, user=user)
    except Order.DoesNotExist:
        return Response({'error': 'Order not found'}, status=404)

    order_items = list(OrderItem.objects.filter(order=order))

    for i in range(len(order_items)):
        if f"reviews[{i}][starCount]" not in data:
            continue
        order_item = order_items[i]
        option = order_item.option
        product = Product.objects.get(id=option.product_id)
        star_count = int(data.get(f"reviews[{i}][starCount]", 5))
        quality = data.get(f"reviews[{i}][quality]", "")
        description = data.get(f"reviews[{i}][description]", "")
        features = data.get(f"reviews[{i}][features]", "")
        content = data.get(f"reviews[{i}][content]", "")

        review = Review.objects.create(
            user=user,
            option=option,
            star_count=star_count,
            quality=quality,
            summary=description,
            featureHighlight=features,
            content=content,
        )

        media_files = request.FILES.getlist(f"reviews[{i}][mediaFiles]")
        for media_file in media_files:
            if not media_file.content_type.startswith('image'):
                continue
            MediaFile.objects.create(
                review=review,
                media_type='image',
                media=media_file
            )

    order.has_review = True
    order.save()
    return Response({'status': 'success'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def api_orderStatus(request, idOrder):
    nowUser = request.user
    order = Order.objects.get(id=idOrder)
    if nowUser != order.user:
        return Response(status=status.HTTP_400_BAD_REQUEST)
    order_serializer = OrderSerializer(order)
    order_data = order_serializer.data
    for item in order_data['orderItem']:
        imgList = [img.strip() for img in item['option']['img'].split(',')]
        item['option']['img'] = imgList
    return Response({
        'order': order_serializer.data
    }, status=status.HTTP_200_OK)


@permission_classes([IsAuthenticated])
class infoUserApiView(APIView):
    def get(self, request):
        user = request.user
        user_final = {
            "firstName": user.first_name,
            "lastName": user.last_name,
            'email': user.email,
            'sex': user.sex,
            'phone': user.phone,
            'birthday': user.birthday,
            'address': user.address
        }
        return Response({'user': user_final}, status=status.HTTP_200_OK)

    def patch(self, request):
        user = request.user
        data = request.data
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'sex' in data:
            user.sex = data['sex']
        if 'birthday' in data:
            user.birthday = data['birthday']
        if 'address' in data:
            user.address = data['address']
        user.save()
        return Response({"detail": "Cập nhật dữ liệu thành công"}, status=status.HTTP_200_OK)
