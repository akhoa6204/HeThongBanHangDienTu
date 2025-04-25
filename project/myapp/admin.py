from django.contrib import admin

from .models import User  # Import đúng model User


class UserAdmin(admin.ModelAdmin):
    fields = ['first_name', 'last_name', 'phone', 'email', 'address', 'img']


admin.site.register(User, UserAdmin)
