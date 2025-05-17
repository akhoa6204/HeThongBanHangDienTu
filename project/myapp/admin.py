from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


class UserAdmin(BaseUserAdmin):
    # Thêm 'groups' vào fieldsets nếu dùng custom user
    fieldsets = (
        ('Thông tin đăng nhập', {'fields': ('username', 'password')}),
        ('Thông tin cá nhân', {'fields': ('first_name', 'last_name', 'email', 'phone', 'address')}),
        ('Phân quyền', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    filter_horizontal = ('groups', 'user_permissions',)


admin.site.register(User, UserAdmin)
