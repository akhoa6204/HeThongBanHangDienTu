# Generated by Django 5.1.7 on 2025-05-23 10:50

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0046_order_update_at'),
    ]

    operations = [
        migrations.CreateModel(
            name='OrderCancellation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField(blank=True, help_text='Lý do hủy đơn hàng', null=True)),
                ('cancelled_at', models.DateTimeField(auto_now_add=True)),
                ('cancelled_by', models.ForeignKey(blank=True, help_text='Người thực hiện hủy đơn', null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('order', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='cancellation', to='myapp.order')),
            ],
        ),
    ]
