# Generated by Django 5.1.7 on 2025-04-06 09:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0002_alter_option_price'),
    ]

    operations = [
        migrations.AlterField(
            model_name='option',
            name='price',
            field=models.DecimalField(decimal_places=2, help_text='Giá gốc của sản phẩm', max_digits=20, null=True),
        ),
    ]
