import json
import re
from collections import defaultdict
from decimal import Decimal
from math import ceil

from django.core.paginator import Paginator
from django.db.models import Sum, Q, CharField
from django.db.models.functions import Cast
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAdminUser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Option, OptionColor, OptionDetail
from .models import Order, Review, ReviewReply, OptionImage
from .models import Product, ProductImage, Category, Brand
from .serializers import ProductSerializer, CategorySerializer, BrandSerializer, ReviewSerializer, \
    OptionSerializer, OrderWithAdminSerializer, OrderWithItemsForAdminSerializer
from .utils import delete_option_image


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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_product_detail(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    product_serializer = ProductSerializer(product, context={"request": request})

    return Response({
        "product": product_serializer.data
    })


# -------------------------------
# ORDER
# -------------------------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_list_orders(request):
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


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_api_update_product_detail(request, productId):
    product = get_object_or_404(Product, id=productId)

    new_name = request.data.get('name', None)
    new_slug = request.data.get('slug', None)
    new_category_id = request.data.get('category', None)
    new_brand_id = request.data.get('brand', None)

    if not new_name or not new_slug or not new_category_id or not new_brand_id:
        return Response({"detail": "Cập nhật thất bại"}, status=status.HTTP_400_BAD_REQUEST)

    product.name = new_name
    product.slug = new_slug
    product.category_id = new_category_id
    product.brand_id = new_brand_id
    product.save()

    deleted_ids_str = request.data.get('deleted_ids', '[]')
    print(f"deleted_ids_str: {deleted_ids_str}")
    try:
        deleted_ids = json.loads(deleted_ids_str)
    except Exception:
        deleted_ids = []

    if deleted_ids:
        images_to_delete = ProductImage.objects.filter(id__in=deleted_ids, product=product)
        for img_obj in images_to_delete:
            delete_option_image(img_obj)

    images = request.FILES.getlist('images')
    for image_file in images:
        ProductImage.objects.create(product=product, img=image_file)

    serializer = ProductSerializer(product, context={"request": request})
    return Response({'success': True, 'product': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated, IsAdminUser])
def admin_api_update_option(request, product_id, option_id=None):
    """
    Frontend gửi data kiểu FormData với key như:
    colors[0][id], colors[0][color], colors[0][price], colors[0][stock],
    colors[0][keep_image_ids][0], colors[0][new_images][0] (file),
    details[0][id], details[0][name], details[0][value], ...
    """

    product = get_object_or_404(Product, id=product_id)

    version = request.POST.get('version', '').strip()
    slug = request.POST.get('slug', '').strip()
    description = request.POST.get('description', '').strip()

    if not version or not slug or not description:
        return Response({"detail": "Thiếu version hoặc slug hoặc description của option"},
                        status=status.HTTP_400_BAD_REQUEST)

    # Xử lý Option
    if option_id:
        option = get_object_or_404(Option, id=option_id, product=product)
    else:
        # Tìm option theo slug + product
        option = Option.objects.filter(product=product, slug=slug).first()
        if option:
            if option.is_active:
                return Response({"detail": "Option với slug này đã tồn tại."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Khôi phục option đã xóa mềm
                option.is_active = True
        else:
            option = Option(product=product)

    option.version = version
    option.slug = slug
    option.description = description
    option.save()

    # --- Xử lý colors ---
    colors_data = defaultdict(dict)

    for key in request.POST:
        m_simple = re.match(r'colors\[(\d+)\]\[(\w+)\]$', key)
        if m_simple:
            idx = int(m_simple.group(1))
            field = m_simple.group(2)
            if field != 'keep_image_ids':
                colors_data[idx][field] = request.POST.get(key)

    for key in request.POST:
        if 'keep_image_ids' in key:
            m = re.match(r'colors\[(\d+)\]\[keep_image_ids\]\[(\d+)\]', key)
            if m:
                idx = int(m.group(1))
                if 'keep_image_ids' not in colors_data[idx] or not isinstance(colors_data[idx]['keep_image_ids'], list):
                    colors_data[idx]['keep_image_ids'] = []
                try:
                    val = request.POST.get(key)
                    if val is not None:
                        colors_data[idx]['keep_image_ids'].append(int(val))
                except (ValueError, TypeError):
                    pass

    processed_color_ids = []

    for color_index in sorted(colors_data.keys()):
        color_info = colors_data[color_index]

        color_id = color_info.get('id')
        color_id = int(color_id) if color_id and color_id.isdigit() else None

        color_name = color_info.get('color', '').strip()
        try:
            price = float(color_info.get('price', 0))
        except ValueError:
            price = 0
        try:
            stock = int(color_info.get('stock', 0))
        except ValueError:
            stock = 0

        keep_image_ids = color_info.get('keep_image_ids', [])

        if not color_name or price <= 0:
            continue

        if color_id:
            option_color = get_object_or_404(OptionColor, id=color_id, option=option)
            processed_color_ids.append(option_color.id)
        else:
            # Tìm color đã xóa mềm trùng tên để khôi phục
            option_color = OptionColor.objects.filter(option=option, color=color_name, is_active=False).first()
            if option_color:
                option_color.is_active = True
            else:
                option_color = OptionColor(option=option)

        option_color.color = color_name
        option_color.price = price
        option_color.stock = stock
        option_color.save()
        processed_color_ids.append(option_color.id)

        # Xử lý ảnh giữ/lưu ảnh mới
        existing_images = OptionImage.objects.filter(option_color=option_color)
        for img_obj in existing_images:
            if img_obj.id not in keep_image_ids:
                delete_option_image(img_obj)

        new_images = []
        prefix = f'colors[{color_index}][new_images]'
        for key_file in request.FILES:
            if key_file.startswith(prefix):
                new_images.append(request.FILES[key_file])
        for file in new_images:
            OptionImage.objects.create(option_color=option_color, img=file)

    # Soft delete những OptionColor không còn trong dữ liệu gửi lên
    obsolete_colors = OptionColor.objects.filter(option=option, is_active=True).exclude(id__in=processed_color_ids)
    for color in obsolete_colors:
        color.is_active = False
        color.save()

    # --- Xử lý details ---
    details_data = defaultdict(dict)

    for key in request.POST:
        if key.startswith('details['):
            m = re.match(r'details\[(\d+)\]\[(\w+)\]', key)
            if m:
                idx = int(m.group(1))
                field = m.group(2)
                details_data[idx][field] = request.POST.get(key)

    processed_detail_ids = []

    for detail_index in sorted(details_data.keys()):
        detail_info = details_data[detail_index]
        detail_id = detail_info.get('id')
        detail_id = int(detail_id) if detail_id and detail_id.isdigit() else None
        name = detail_info.get('name', '').strip()
        value = detail_info.get('value', '').strip()

        if not name or not value:
            continue

        if detail_id:
            detail_obj = OptionDetail.objects.filter(id=detail_id, option=option).first()
            if detail_obj:
                detail_obj.name = name
                detail_obj.value = value
                detail_obj.save()
                processed_detail_ids.append(detail_obj.id)
            else:
                new_detail = OptionDetail.objects.create(option=option, name=name, value=value)
                processed_detail_ids.append(new_detail.id)
        else:
            # Tìm detail soft deleted trùng name + value để khôi phục
            detail_obj = OptionDetail.objects.filter(option=option, name=name, value=value, is_active=False).first()
            if detail_obj:
                detail_obj.is_active = True
                detail_obj.name = name
                detail_obj.value = value
                detail_obj.save()
                processed_detail_ids.append(detail_obj.id)
            else:
                new_detail = OptionDetail.objects.create(option=option, name=name, value=value)
                processed_detail_ids.append(new_detail.id)

    # Soft delete những OptionDetail không còn trong dữ liệu gửi lên
    OptionDetail.objects.filter(option=option, is_active=True).exclude(id__in=processed_detail_ids).update(
        is_active=False)

    option_serializer = OptionSerializer(option, context={"request": request})
    return Response({
        "success": True,
        "option": option_serializer.data,
    })


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_api_delete_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    if not product.status:
        return Response({"detail": "Sản phẩm đã bị xoá trước đó"}, status=status.HTTP_400_BAD_REQUEST)
    product.status = False
    product.save()
    return Response({"detail": "Xoá sản phẩm thành công"}, status=status.HTTP_200_OK)


@api_view(["DELETE"])
@permission_classes([IsAdminUser])
def admin_api_delete_option(request, option_id):
    option = get_object_or_404(Option, id=option_id)
    option.is_active = False
    option.save()
    OptionColor.objects.filter(option=option).update(is_active=False)
    OptionDetail.objects.filter(option=option).update(is_active=False)
    option_colors = OptionColor.objects.filter(option=option)
    OptionImage.objects.filter(option_color__in=option_colors).update(is_active=False)

    return Response({"detail": "Xóa phiên bản thành công"}, status=status.HTTP_200_OK)


@api_view(["POST"])
@permission_classes([IsAdminUser])
def admin_api_restore_product(request, product_id):
    product = get_object_or_404(Product, id=product_id)
    product.status = True
    product.save()
    return Response({"detail": "Khôi phục sản phẩm thành công"}, status=status.HTTP_200_OK)
