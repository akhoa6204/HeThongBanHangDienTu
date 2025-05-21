import json
from decimal import Decimal
from math import ceil

from django.conf import settings
from django.core.files.storage import default_storage
from django.core.paginator import Paginator
from django.db import transaction
from django.db.models import Prefetch, Sum, Q, CharField
from django.db.models.functions import Cast
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.generics import get_object_or_404
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Option, OptionColor, OptionDetail
from .models import Order, Review, ReviewReply, OptionImage
from .models import Product, ProductImage, Category, Brand
from .serializers import ProductSerializer, CategorySerializer, BrandSerializer, ReviewSerializer, \
    OptionSerializer, OptionReviewSerializer, OrderWithAdminSerializer, OrderWithItemsForAdminSerializer


# -------------------------------
# PRODUCT APIs (Admin)
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_products(request):
    page = int(request.GET.get('page', 1))
    search = request.GET.get('search', '').strip()
    page_size = 5

    all_products = Product.objects.all().order_by('-id')

    if search:
        filtered_products = all_products.annotate(
            id_str=Cast('id', CharField())
        ).filter(
            Q(id_str__icontains=search) | Q(name__icontains=search) | Q(category__name__icontains=search)
        )
    else:
        filtered_products = all_products

    total_products = filtered_products.count()
    total_pages = ceil(total_products / page_size)

    start = (page - 1) * page_size
    end = start + page_size
    paginated_products = filtered_products[start:end]

    serializer = ProductSerializer(paginated_products, many=True, context={'request': request})
    products_data = serializer.data

    for i, product_instance in enumerate(paginated_products):
        total_quantity = 0
        for option in product_instance.options.all():
            total_stock = option.optioncolor_set.aggregate(total_stock=Sum('stock'))['total_stock'] or 0
            total_quantity += total_stock
        products_data[i]['quantity'] = total_quantity

    return Response({
        "products": products_data,
        "total_products": total_products,
        "total_pages": total_pages,
        "current_page": page,
        "page_size": page_size
    })


@permission_classes([IsAuthenticated])
class CreateProductView(APIView):
    def get(self, request):
        category = Category.objects.all()
        category_serializer = CategorySerializer(category, many=True)

        brand = Brand.objects.all()
        brand_serializer = BrandSerializer(brand, many=True)
        return Response({
            "category": category_serializer.data,
            'brand': brand_serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        try:
            product_raw = request.data.get('product')
            if not product_raw:
                return Response({'error': 'Thiếu trường product'}, status=status.HTTP_400_BAD_REQUEST)

            product_data = json.loads(product_raw)
            name = product_data.get('name')
            slug = product_data.get('slug')
            category = product_data.get('category')
            brand = product_data.get('brand')

            if not all([name, slug, category, brand]):
                return Response({'error': 'Thông tin sản phẩm không đầy đủ'}, status=status.HTTP_400_BAD_REQUEST)

            product = Product.objects.create(
                name=name, slug=slug, category_id=category, brand_id=brand
            )

            product_images = request.FILES.getlist('product_images')
            for img in product_images:
                ProductImage.objects.create(product=product, img=img)

            options_raw = request.data.get('options')
            options_data = json.loads(options_raw)

            for opt_idx, opt in enumerate(options_data):
                option_obj = Option.objects.create(
                    product=product,
                    version=opt['version'],
                    slug=opt['slug'],
                    description=opt.get('description', '')
                )

                for detail in opt.get('details', []):
                    OptionDetail.objects.create(
                        option=option_obj,
                        name=detail['name'],
                        value=detail['value']
                    )

                for color_idx, color in enumerate(opt.get('colors', [])):
                    option_color = OptionColor.objects.create(
                        option=option_obj,
                        color=color['color'],
                        price=Decimal(color['price']),
                        stock=Decimal(color['stock'])
                    )

                    key = f'option_images_{opt_idx}_{color_idx}'
                    images = request.FILES.getlist(key)

                    for img in images:
                        print(f"Tạo OptionImage với file: {img.name}")
                        try:
                            OptionImage.objects.create(option_color=option_color, img=img)
                        except Exception as e:
                            print(f"Lỗi tạo OptionImage: {e}")
                            return Response({'error': f'Lỗi tạo OptionImage: {str(e)}'},
                                            status=status.HTTP_400_BAD_REQUEST)

            return Response({'message': 'Tạo sản phẩm thành công'}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_category(request):
    category = request.data.get('category')
    if category:
        new_category = Category.objects.create(name=category.get('name'), slug=category.get('slug'))
        return Response({"detail": "Thêm danh mục thành công"}, status=status.HTTP_200_OK)
    else:
        return Response({"detail": "Thêm danh mục thất bại"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_brand(request):
    brand = request.data.get('brand')
    if brand:
        new_brand = Brand.objects.create(name=brand.get('name'), slug=brand.get('slug'), origin=brand.get('origin'))
        return Response({"detail": "Thêm nhà cung cấp thành công thành công"}, status=status.HTTP_200_OK)
    else:
        return Response({"detail": "Thêm nhà cung cấp thất bại"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsAdminUser])
@parser_classes([MultiPartParser, FormParser])
def admin_update_product_and_options(request, product_id):
    try:
        product = Product.objects.prefetch_related(
            Prefetch('options', queryset=Option.objects.all())
        ).get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Sản phẩm không tồn tại.", "code": "PRODUCT_NOT_FOUND"}, status=404)

    data = request.data.copy()
    product_serializer = ProductSerializer(product, data=data, partial=True)

    if not product_serializer.is_valid():
        return Response({
            "error": "Dữ liệu sản phẩm không hợp lệ.",
            "code": "INVALID_PRODUCT_DATA",
            "details": product_serializer.errors
        }, status=400)

    # Xử lý ảnh sản phẩm (ProductImage)
    files = request.FILES.getlist('img')
    if files:
        # Xóa ảnh cũ
        old_images = ProductImage.objects.filter(product=product)
        for old_image in old_images:
            if old_image.img and default_storage.exists(old_image.img.name):
                default_storage.delete(old_image.img.name)
            old_image.delete()

        # Lưu ảnh mới
        for image in files:
            validate_image(image)
            ProductImage.objects.create(product=product, img=image)

    # Xử lý tùy chọn sản phẩm
    options_data = request.data.get('options', [])
    if not isinstance(options_data, list):
        return Response({"error": "Dữ liệu tùy chọn không hợp lệ.", "code": "INVALID_OPTIONS_DATA"}, status=400)

    updated_options = []
    deleted_option_ids = request.data.get('deleted_options', [])

    with transaction.atomic():
        product_serializer.save()

        # Xóa tùy chọn
        for option_id in deleted_option_ids:
            try:
                option = Option.objects.get(id=option_id, product=product)
                if option.img:
                    for old_image in option.img.split(','):
                        if old_image and default_storage.exists(old_image):
                            default_storage.delete(old_image)
                option.delete()
            except Option.DoesNotExist:
                continue

        for index, option_data in enumerate(options_data):
            option_files = request.FILES.getlist(f'options[{index}][img][]')
            if option_files:
                option_image_paths = []
                for image in option_files:
                    validate_image(image)
                    saved_path = default_storage.save(f'options/{image.name}', image)
                    option_image_paths.append(saved_path)
                option_data['img'] = ','.join(option_image_paths)

            try:
                if option_data.get('is_new', False):
                    option_serializer = OptionSerializer(data=option_data)
                    if option_serializer.is_valid():
                        option = option_serializer.save(product=product)
                        updated_options.append(OptionReviewSerializer(option).data)
                    else:
                        return Response({
                            "error": f"Dữ liệu tùy chọn {index} không hợp lệ.",
                            "code": "INVALID_OPTION_DATA",
                            "details": option_serializer.errors
                        }, status=400)
                else:
                    try:
                        option = Option.objects.get(id=option_data.get('id'), product=product)
                        option_serializer = OptionSerializer(option, data=option_data, partial=True)
                        if option_serializer.is_valid():
                            if option_files and option.img:
                                for old_image in option.img.split(','):
                                    if old_image and default_storage.exists(old_image):
                                        default_storage.delete(old_image)
                            option_serializer.save()
                            updated_options.append(OptionReviewSerializer(option).data)
                        else:
                            return Response({
                                "error": f"Dữ liệu tùy chọn {index} không hợp lệ.",
                                "code": "INVALID_OPTION_DATA",
                                "details": option_serializer.errors
                            }, status=400)
                    except Option.DoesNotExist:
                        return Response({
                            "error": f"Tùy chọn với ID {option_data.get('id')} không tồn tại.",
                            "code": "OPTION_NOT_FOUND"
                        }, status=404)
            except Exception as e:
                return Response({
                    "error": f"Lỗi khi xử lý tùy chọn: {str(e)}",
                    "code": "OPTION_PROCESSING_ERROR"
                }, status=400)

    return Response({
        "message": "Cập nhật sản phẩm và tùy chọn thành công.",
        "product": product_serializer.data,
        "options": updated_options
    }, status=200)


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


from rest_framework import status


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def admin_delete_product(request, product_id):
    try:
        product = Product.objects.get(id=product_id)
    except Product.DoesNotExist:
        return Response({"detail": "Sản phẩm không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    product.delete()
    return Response({"detail": "Đã xoá thành công."}, status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_product_detail(request, product_id):
    try:
        product = Product.objects.prefetch_related('options').get(id=product_id)
    except Product.DoesNotExist:
        return Response({"error": "Sản phẩm không tồn tại."}, status=404)

    # Xử lý ảnh
    img_raw = product.img or ""
    img_list = [img.strip(';').strip() for img in img_raw.split(',') if img.strip()]
    img_urls = [
        img if img.startswith("http") else request.build_absolute_uri(settings.MEDIA_URL + img)
        for img in img_list
    ]

    # Chuẩn bị option
    options = []
    for opt in product.options.all():
        options.append({
            "version": opt.version,
            "color": opt.color,
            "price": opt.price,
            "quantity": opt.quantity,
            "img": opt.img
        })

    return Response({
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "category": product.category.name,
        "brand": product.brand.name,
        "img": img_urls,
        "options": options
    })


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

    # Xử lý ảnh sản phẩm
    img_raw = product.img or ""
    img_paths = [img.strip(';').strip() for img in img_raw.split(',') if img.strip()]
    image_urls = [
        img if img.startswith("http") else request.build_absolute_uri(settings.MEDIA_URL + img)
        for img in img_paths
    ]

    # Xử lý các options
    options = []
    for option in product.options.all():
        opt_img_raw = option.img or ""
        opt_img_paths = [img.strip(';').strip() for img in opt_img_raw.split(',') if img.strip()]
        opt_image_urls = [
            img if img.startswith("http") else request.build_absolute_uri(settings.MEDIA_URL + img)
            for img in opt_img_paths
        ]

        options.append({
            "id": option.id,
            "version": option.version,
            "color": option.color,
            "price": option.price,
            "quantity": option.quantity,
            "img": opt_image_urls,
        })

    # Trả về dữ liệu sản phẩm và options
    return Response({
        "id": product.id,
        "name": product.name,
        "slug": product.slug,
        "category": {
            "id": product.category.id,
            "name": product.category.name
        },
        "brand": {
            "id": product.brand.id,
            "name": product.brand.name
        },
        "img": image_urls,
        "options": options
    }, status=200)


# -------------------------------
# ORDER APIs (Admin)
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_orders(request):
    # Lấy query param page, search
    page = int(request.GET.get('page', 1))
    search = request.GET.get('search', '').strip()

    if page < 1:
        page = 1

    orders = Order.objects.all().order_by('-created_at')
    if search:
        if search.isdigit():
            orders = orders.filter(
                Q(id=int(search)) |
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search)
            )
        else:
            # Nếu search không phải số, filter theo tên/email
            orders = orders.filter(
                Q(user__first_name__icontains=search) |
                Q(user__last_name__icontains=search) |
                Q(user__email__icontains=search)
            )

    total = orders.count()
    per_page = 8
    total_pages = (total // per_page) + (1 if total % per_page else 0)

    if total_pages > 0 and page > total_pages:
        return Response({"error": "Trang không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    start = (page - 1) * per_page
    end = start + per_page
    orders_page = orders[start:end]

    if not orders_page and page != 1:
        return Response({"error": "Trang không tồn tại."}, status=status.HTTP_404_NOT_FOUND)

    order_serializers = OrderWithAdminSerializer(orders_page, many=True)

    # Trả về kết quả
    return Response({
        'orders': order_serializers.data,
        'total_pages': total_pages,
        'current_page': page,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_view_order(request, order_id):
    order = get_object_or_404(Order, id=order_id)
    order_serializers = OrderWithItemsForAdminSerializer(order, context={"request": request})
    return Response({
        'order': order_serializers.data,
    })


# -------------------------------
# order (Admin)
# -------------------------------

@api_view(['PATCH', 'GET'])
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
    try:
        page = int(request.GET.get('page', 1))
        if page < 1:
            page = 1
    except ValueError:
        return Response({"detail": "Invalid page number"}, status=status.HTTP_400_BAD_REQUEST)

    page_size = 3
    reviews = Review.objects.all().order_by('-created_at')

    star = request.GET.get('star')
    if star is not None:
        try:
            star = int(star)
            if star == 6:
                reviews = reviews.filter(reviewreply__isnull=False)
            elif 1 <= star <= 5:
                reviews = reviews.filter(star_count=star)
            else:
                return Response({"detail": "Invalid star value"}, status=status.HTTP_400_BAD_REQUEST)
        except ValueError:
            return Response({"detail": "Invalid star value"}, status=status.HTTP_400_BAD_REQUEST)

    paginator = Paginator(reviews, page_size)

    # Nếu không có trang nào thì trả về trang rỗng
    if paginator.num_pages == 0:
        return Response({
            'reviews': [],
            'current_page': 1,
            'total_pages': 0,
            'has_next': False,
            'has_previous': False,
        }, status=status.HTTP_200_OK)

    if page > paginator.num_pages:
        return Response({"detail": "Page not found"}, status=status.HTTP_404_NOT_FOUND)

    reviews_page = paginator.page(page)
    serializer = ReviewSerializer(reviews_page.object_list, many=True, context={"request": request})

    return Response({
        'reviews': serializer.data,
        'current_page': page,
        'total_pages': paginator.num_pages,
        'has_next': reviews_page.has_next(),
        'has_previous': reviews_page.has_previous(),
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_reply_review(request, review_id):
    try:
        review = Review.objects.get(id=review_id)
        content = request.data.get("content")

        if not content:
            return Response({"error": "Nội dung phản hồi không được để trống."}, status=400)
        try:
            reply = ReviewReply.objects.get(review=review)
        except ReviewReply.DoesNotExist:
            reply = ReviewReply(review=review)

        reply.content = content
        reply.admin = request.user  # 🔥 Gán admin trước khi save
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


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def api_admin_update_order_status(request):
    order_id = int(request.data.get('orderId'))
    new_status = str(request.data.get('status'))

    if not order_id or not new_status:
        return Response({"detail": "Missing orderId or status"}, status=status.HTTP_400_BAD_REQUEST)

    order = get_object_or_404(Order, id=order_id)

    valid_transitions = {
        'pending': ['processing', 'cancelled'],
        'processing': ['shipping'],
        'shipping': ['shipped'],
        'shipped': [],
        'cancelled': [],
    }

    current_status = order.status
    if new_status not in valid_transitions.get(current_status, []):
        return Response({
            "detail": f"Không thể chuyển từ '{current_status}' sang '{new_status}'"
        }, status=status.HTTP_400_BAD_REQUEST)

    order.status = new_status
    order.save()
    return Response({"detail": "Cập nhật đơn hàng thành công"}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def api_update_review_reply(request):
    review_id = request.data.get('id')
    content = request.data.get('content')

    if not review_id:
        return Response({"detail": "Thiếu ID đánh giá"}, status=status.HTTP_400_BAD_REQUEST)

    if not content:
        try:
            ReviewReply.objects.get(review_id=review_id).delete()
            return Response({"detail": "Xóa câu trả lời thành công"}, status=status.HTTP_200_OK)
        except ReviewReply.DoesNotExist:
            return Response({"detail": "Không tồn tại câu trả lời"}, status=status.HTTP_200_OK)
    reply, created = ReviewReply.objects.update_or_create(
        review_id=review_id,
        defaults={
            'content': content,
            'admin': request.user
        }
    )
    message = "Tạo câu trả lời thành công" if created else "Cập nhật câu trả lời thành công"
    return Response({"detail": message}, status=status.HTTP_200_OK)
