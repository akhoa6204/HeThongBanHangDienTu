# HeThongBanHangDienTu
Hệ thống bán hàng điện tử
Tạo dự án 
    django-admin startproject --tên dự án
Tạo ứng dụng
    python manage.py startapp --tên ứng dụng
Tạo bảng dữ liệu 
    python manage.py makemigrations --tên ứng dụng
Tạo tất cả các bảng dữ liệu liên kết với Model (đã sinh mã ở trên) trong cơ sở dữ liệu bằng
    python manage.py migrate --tên ứng dụng 
Thao tác với dữ liệu sử dụng Model
    python manage.py shell 
Tạo tài khoản Superuser
    python manage.py createsuperuser

1. 
django-admin startproject KTGK
python manage.py startapp qlbaiviet
setting.py -> INSTALLED_APPs -> thêm 'qlbaiviet'

	-> import os -> DIR -> [os.path.join('BASE DIR', 'templates')]
Chạy lênh python manage.py migrate để tạo CSDL SQLite -> db.sqlite3
Vô models.py -> tạo Models theo đề 

	-> Terminal -> python manage.py makemigrations qlbaiviet
	-> python manage.py migrate
python manage.py shell : nhập dữ liệu vào Terminal

	-> from qlbaiviet.models (tên_app.models) import BaiViet, ChuyenMuc, BaiVietChuyenMuc (import vô class)

Tạo tài khoản  superuser (admin)

python manage.py createsuperuser


Xây dựng view và templates 

Vào views.py 

	-> from django.shortcuts import render, get_object_or_404
	-> from .models import BaiViet
	-> ghi hàm 
Vào urls.py tạo đường dẫn 

	-> KTGK/qlbaiviet tạo tập tin urls.py
KTGK/qlbaiviet Tạo templates -> tạo xembaiviet.html



mh1 = MatHang.objects.create(Ten_Hang='Ban HP', MoTa='Ban go', DVT='Cai')