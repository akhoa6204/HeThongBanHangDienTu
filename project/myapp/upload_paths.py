import os
import re
import uuid

import unicodedata
from django.conf import settings


class ProcessingUploadPath:
    @staticmethod
    def processingColor(color):
        if not color:
            return "default-color"
        color = unicodedata.normalize('NFD', color)
        color = color.encode('ascii', 'ignore').decode('utf-8')
        color = re.sub(r'\s+', '-', color.lower())
        return color

    @staticmethod
    def ensure_folder_exists(path):
        if not os.path.exists(path):
            os.makedirs(path)

    @staticmethod
    def option_image_upload_path(instance, filename):
        product_slug = instance.option_color.option.product.slug or f"product-{instance.option_color.option.product.id}"
        version = instance.option_color.option.slug or "default-version"
        color = ProcessingUploadPath.processingColor(instance.option_color.color)
        ext = os.path.splitext(filename)[1]

        folder_path = os.path.join(settings.MEDIA_ROOT, f"products/{product_slug}/options/{version}")
        ProcessingUploadPath.ensure_folder_exists(folder_path)

        existing_files = [f for f in os.listdir(folder_path) if f.startswith(f"{version}_{color}")]
        count = len(existing_files) + 1

        filename = f"{version}_{color}_{count}{ext}"
        return f"products/{product_slug}/options/{version}/{filename}"

    @staticmethod
    def product_image_upload_path(instance, filename):
        ext = os.path.splitext(filename)[1]
        slug_or_id = instance.product.slug or str(instance.id)
        folder_path = os.path.join(settings.MEDIA_ROOT, f"products/{slug_or_id}/product")
        ProcessingUploadPath.ensure_folder_exists(folder_path)

        filename = f"{slug_or_id}{ext}"
        return f"products/{slug_or_id}/product/{filename}"

    @staticmethod
    def review_upload_path(instance, filename):
        ext = os.path.splitext(filename)[1]
        product_slug = instance.review.option_color.option.product.slug
        folder_path = os.path.join(settings.MEDIA_ROOT, f"reviews/{product_slug}")
        ProcessingUploadPath.ensure_folder_exists(folder_path)

        base_filename = str(uuid.uuid4())
        filename = f"{base_filename}{ext}"
        return f"reviews/{product_slug}/{filename}"
