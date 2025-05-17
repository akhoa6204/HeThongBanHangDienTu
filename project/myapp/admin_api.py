import os
from django.core.files.storage import default_storage
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.paginator import Paginator, EmptyPage
from django.conf import settings
from .models import Product, Category, Brand, Option, Order, OrderItem, Review, ReviewReply
from .serializers import ProductSerializer, CategorySerializer, BrandSerializer, OrderSerializer, ReviewSerializer


# -------------------------------
# PRODUCT APIs (Admin)
# -------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_products(request):
    products = Product.objects.prefetch_related('options').all().order_by('-id')
    serializer = ProductSerializer(products, many=True)
    products_data = serializer.data

    for i, product in enumerate(products_data):
        # Xử lý ảnh: tạo URL đầy đủ
        img_raw = product.get('img', '')
        if isinstance(img_raw, str):
            img_paths = [img.strip(';').strip() for img in img_raw.split(',') if img.strip()]
        elif isinstance(img_raw, list):
            img_paths = [img.strip() for img in img_raw if img.strip()]
        else:
            img_paths = []

        image_urls = []
        for path in img_paths:
            if path.startswith('http://') or path.startswith('https://'):
                image_urls.append(path)  # đã là URL tuyệt đối
            else:
                image_urls.append(request.build_absolute_uri(settings.MEDIA_URL + path))  # ảnh cục bộ
        product['img'] = image_urls

        # Tính tổng số lượng từ options
        product_instance = products[i]
        total_quantity = sum(option.quantity for option in product_instance.options.all())
        product['quantity'] = total_quantity

    return Response({"products": products_data})

from rest_framework.parsers import MultiPartParser, FormParser

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])  # Thêm dòng này
def admin_create_product(request):
    data = request.data
    required_fields = ['name', 'slug', 'category_id', 'brand_id', 'img']

    # Kiểm tra các trường bắt buộc
    for field in required_fields:
        if field not in data or not data[field]:
            return Response({"error": f"Thiếu trường bắt buộc: {field}"}, status=400)

    try:
        category = Category.objects.get(id=data['category_id'])
        brand = Brand.objects.get(id=data['brand_id'])
    except (Category.DoesNotExist, Brand.DoesNotExist):
        return Response({"error": "Danh mục hoặc nhà cung cấp không tồn tại."}, status=400)

    # Xử lý ảnh: request.FILES có thể chứa nhiều ảnh
    files = request.FILES.getlist('img')  # Lấy danh sách các file ảnh
    if not files:
        return Response({"error": "Chưa chọn ảnh hoặc ảnh không hợp lệ."}, status=400)

    image_paths = []
    for image in files:
        saved_path = default_storage.save(f'products/{image.name}', image)
        image_paths.append(saved_path)

    # Lưu chuỗi đường dẫn vào field `img`
    img_value = ','.join(image_paths)

    # Tạo sản phẩm
    product = Product.objects.create(
        name=data['name'],
        slug=data['slug'],
        category=category,
        brand=brand,
        img=img_value
    )

    return Response({
        "message": "Tạo sản phẩm thành công",
        "product_id": product.id,
        "image_urls": [request.build_absolute_uri(settings.MEDIA_URL + path) for path in image_paths]
    }, status=201)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_view_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Không tìm thấy sản phẩm."}, status=404)

    serializer = ProductSerializer(product)
    product_data = serializer.data

    # Xử lý ảnh
    img_raw = product_data.get('img', '')
    img_list = [img.strip(';').strip() for img in img_raw.split(',') if img.strip()]
    product_data['img'] = img_list

    return Response({"product": product_data})



@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def admin_update_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return JsonResponse({"error": "Sản phẩm không tồn tại."}, status=404)

    # Tạo bản sao dữ liệu request
    data = request.data.copy()

    serializer = ProductSerializer(product, data=data, partial=True)

    if serializer.is_valid():
        serializer.save()
        return JsonResponse({
            "message": "Cập nhật sản phẩm thành công.",
            "product": serializer.data
        })
    else:
        return JsonResponse({
            "error": "Dữ liệu không hợp lệ.",
            "details": serializer.errors
        }, status=400)



@api_view(['DELETE','GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_delete_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
        product.delete()
        return Response({"message": "Xóa sản phẩm thành công."})
    except Product.DoesNotExist:
        return Response({"error": "Không tìm thấy sản phẩm."}, status=404)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def admin_list_categories_brands(request):
    categories = Category.objects.all()
    brands = Brand.objects.all()

    categories_serialized = CategorySerializer(categories, many=True)
    brands_serialized = BrandSerializer(brands, many=True)

    return Response({
        "categories": categories_serialized.data,
        "brands": brands_serialized.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_view_product_with_options(request, product_id):
    try:
        product = Product.objects.prefetch_related('options').get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Không tìm thấy sản phẩm."}, status=404)

    # Serialize product
    serializer = ProductSerializer(product)
    product_data = serializer.data

    # Xử lý ảnh: tạo URL đầy đủ
    img_raw = product_data.get('img', '')
    if isinstance(img_raw, str):
        img_paths = [img.strip(';').strip() for img in img_raw.split(',') if img.strip()]
    elif isinstance(img_raw, list):
        img_paths = [img.strip() for img in img_raw if img.strip()]
    else:
        img_paths = []

    image_urls = []
    for path in img_paths:
        if path.startswith('http://') or path.startswith('https://'):
            image_urls.append(path)  # đã là URL tuyệt đối
        else:
            image_urls.append(request.build_absolute_uri(settings.MEDIA_URL + path))  # ảnh cục bộ

    product_data['img'] = image_urls

    # Serialize options
    options = product.options.all()
    options_data = []
    for option in options:
        options_data.append({
            "id": option.id,
            "name": option.name,
            "price": option.price,
            "quantity": option.quantity,
            # Thêm các field khác nếu cần
        })

    return Response({
        "product": product_data,
        "options": options_data
    })

# -------------------------------
# ORDER APIs (Admin)
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_orders(request):
    orders = Order.objects.all().order_by('-created_at')
    page = int(request.GET.get('page', 1))
    paginator = Paginator(orders, 10)

    try:
        orders_page = paginator.page(page)
    except EmptyPage:
        return Response({"error": "Trang không tồn tại."}, status=404)

    data = []
    for order in orders_page:
        user = order.user
        order_items = order.order_items.all()

        item_data = []
        for item in order_items:
            product_name = "Không rõ"
            version = color = img_list = None

            if item.option:
                product = getattr(item.option, 'product', None)
                if product:
                    product_name = product.name
                    version = item.option.version
                    color = item.option.color
                    img_raw = item.option.img or ''
                    img_list = [img.strip(';').strip() for img in img_raw.split(',') if img.strip()]

            item_data.append({
                "product_name": product_name,
                "version": version,
                "color": color,
                "img": img_list,
            })

        data.append({
            'id': order.id,
            'user': f"{user.first_name} {user.last_name}" if user else "Không rõ",
            'phone': getattr(user, 'phone', "Không rõ"),
            'email': getattr(user, 'email', "Không rõ"),
            'address': getattr(user, 'address', "Không rõ"),
            'status': order.status,
            'created_at': order.created_at,
            'orderItem': item_data,
        })

    return Response({
        'orders': data,
        'total_pages': paginator.num_pages,
        'current_page': page,
    })



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_view_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Không tìm thấy đơn hàng."}, status=404)

    items = []
    for item in order.order_items.all():
        option = item.option
        product = option.product
        img_list = [img.strip(';').strip() for img in option.img.split(',') if img.strip()] if option.img else []

        items.append({
            'product': product.name,
            'version': option.version,
            'color': option.color,
            'quantity': item.quantity,
            'price': option.price,
            'discount': option.discount,
            'total': item.total_price(),
            'img': img_list,
        })

    return Response({
        'order_id': order.id,
        'user': f"{order.user.first_name} {order.user.last_name}",
        'status': order.status,
        'address': order.address,
        'created_at': order.created_at,
        'items': items,
        'total_price': order.total_price
    })



@api_view(['PATCH','GET'])
@permission_classes([IsAuthenticated])
def admin_update_order_status(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Không tìm thấy đơn hàng."}, status=404)

    status_update = request.data.get('status')

    if not status_update:
        return Response({"error": "Thiếu dữ liệu 'status'."}, status=400)

    valid_statuses = ['pending', 'processing', 'shipping', 'shipped', 'cancelled']
    if status_update not in valid_statuses:
        return Response({"error": "Trạng thái không hợp lệ."}, status=400)
    order.status = status_update
    order.save()

    return Response({
        "message": f"Đã cập nhật trạng thái đơn hàng {order.id} thành '{status_update}'.",
        "status": order.status
    })


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_order(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        order.delete()
        return Response({"message": f"Đã xóa đơn hàng {order_id} thành công."})
    except Order.DoesNotExist:
        return Response({"error": "Không tìm thấy đơn hàng."}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_order_info_basic(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
        data = {
            'id': order.id,
            'code': order.code,
            'name': order.customer_name,
            'email': order.customer_email,
            'shipping_address': order.shipping_address,
            'billing_address': order.billing_address,
            'total': order.total_amount,
        }
        return JsonResponse(data)
    except Order.DoesNotExist:
        return JsonResponse({'error': 'Không tìm thấy đơn hàng.'}, status=404)

# -------------------------------
# đánh giá APIs (Admin)
# -------------------------------
from rest_framework.pagination import PageNumberPagination

class ReviewPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'page_size'
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_reviews(request):
    reviews = Review.objects.all().order_by('-created_at')
    paginator = ReviewPagination()
    page = paginator.paginate_queryset(reviews, request)
    serializer = ReviewSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reply_review(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
        content = request.data.get("content")

        if not content:
            return Response({"error": "Nội dung phản hồi không được để trống."}, status=400)

        # Kiểm tra nếu đã có phản hồi trước đó
        reply, created = ReviewReply.objects.get_or_create(review=review)

        # Cập nhật hoặc tạo mới phản hồi
        reply.content = content
        reply.admin = request.user
        reply.save()

        return Response({"message": "Phản hồi đã được lưu thành công."})

    except Review.DoesNotExist:
        return Response({"error": "Không tìm thấy đánh giá."}, status=404)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_view_review(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
        serializer = ReviewSerializer(review)
        return Response({"review": serializer.data})
    except Review.DoesNotExist:
        return Response({"error": "Không tìm thấy đánh giá."}, status=404)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_review(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
        review.delete()
        return Response({"message": "Xóa đánh giá thành công."})
    except Review.DoesNotExist:
        return Response({"error": "Không tìm thấy đánh giá."}, status=404)


# -------------------------------
# Bill APIs (Admin)
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_manage_bill_detail(request, order_id):
    try:
        order = Order.objects.get(id=order_id)
    except Order.DoesNotExist:
        return Response({"error": "Không tìm thấy đơn hàng."}, status=404)

    user = order.user
    order_items = order.order_items.all()

    items = []
    for item in order_items:
        option = item.option
        product = option.product if option else None
        img_list = []

        if option and option.img:
            img_list = [img.strip(';').strip() for img in option.img.split(',') if img.strip()]

        items.append({
            'product': product.name if product else "Không rõ",
            'version': option.version if option else None,
            'color': option.color if option else None,
            'quantity': item.quantity,
            'price': option.price if option else 0,
            'discount': option.discount if option else 0,
            'total': item.total_price() if hasattr(item, 'total_price') else 0,
            'img': img_list,
        })

    return Response({
        'order_id': order.id,
        'order_code': order.code,
        'status': order.status,
        'created_at': order.created_at,
        'customer': {
            'name': f"{user.first_name} {user.last_name}" if user else order.customer_name,
            'email': getattr(user, 'email', order.customer_email),
            'phone': getattr(user, 'phone', None),
            'address': getattr(user, 'address', order.shipping_address),
        },
        'items': items,
        'total_price': order.total_price if hasattr(order, 'total_price') else order.total_amount,
    })
