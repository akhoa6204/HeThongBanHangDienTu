# Generated by Django 5.1.7 on 2025-05-01 05:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('myapp', '0026_alter_user_phone'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='sex',
            field=models.CharField(choices=[('male', 'Nam'), ('female', 'Nữ'), ('other', 'Khác')], default='male', max_length=50),
        ),
    ]
