import csv
from decimal import Decimal

from django.core.management.base import BaseCommand, CommandError
from myapp.models import Category, Brand, Product, Option

# python manage.py load_product_data
# --category path/to/category.csv
# --brand path/to/brand.csv
# --product path/to/product.csv
# --option path/to/option.csv

class Command(BaseCommand):
    help = 'Load category, brand, product, and option data from CSV files.'

    def add_arguments(self, parser):
        parser.add_argument('--category', type=str, help='Path to category CSV file')
        parser.add_argument('--brand', type=str, help='Path to brand CSV file')
        parser.add_argument('--product', type=str, help='Path to product CSV file')
        parser.add_argument('--option', type=str, help='Path to option CSV file')

    def read_csv(self, path):
        try:
            with open(path, encoding='utf-8') as f:
                reader = csv.DictReader(f)
                return list(reader)
        except FileNotFoundError:
            raise CommandError(f"File {path} not found.")
        except Exception as e:
            raise CommandError(f"Error reading {path}: {e}")

    def handle(self, *args, **options):
        # --- Load Category ---
        if options['category']:
            categories = self.read_csv(options['category'])
            for row in categories:
                c, created = Category.objects.get_or_create(name=row['CategoryName'])
                if created:
                    self.stdout.write(f'Created Category: {c.name}')
                else:
                    self.stdout.write(f'ℹ️ Category already exists: {c.name}')

        # --- Load Brand ---
        if options['brand']:
            brands = self.read_csv(options['brand'])
            for row in brands:
                b, created = Brand.objects.get_or_create(name=row['name'], defaults={'origin': row.get('nation', '')})
                if created:
                    self.stdout.write(f'Created Brand: {b.name}')
                else:
                    self.stdout.write(f'ℹ️ Brand already exists: {b.name}')

        # --- Load Product ---
        if options['product']:
            products = self.read_csv(options['product'])
            for row in products:
                try:
                    category = Category.objects.get(id=row['category_id'])
                    brand = Brand.objects.get(id=row['brand_id'])
                except Category.DoesNotExist as e:
                    self.stderr.write(f"Category '{row['category_id']}' not found for Product {row['name']}")
                    continue
                except Brand.DoesNotExist as e:
                    self.stderr.write(f"Brand '{row['brand_id']}' not found for Product {row['name']}")
                    continue
                p, created = Product.objects.get_or_create(name=row['name'],
                    defaults={
                        'category': category,
                        'brand': brand,
                        'img': row.get('img', '')
                    }
                )
                if created:
                    self.stdout.write(f'Created Product: {p.name}')
                else:
                    self.stdout.write(f'ℹ️ Product already exists: {p.name}')

        # --- Load Option ---
        if options['option']:
            options_data = self.read_csv(options['option'])
            for row in options_data:
                try:
                    product = Product.objects.get(id=row['product_id'])
                except Product.DoesNotExist:
                    self.stderr.write(f"Skip Option: Product {row['product_id']} not found")
                    continue
                try:
                    opt, created = Option.objects.get_or_create(
                        product=product,
                        version=row.get('version', ''),
                        color=row.get('color', ''),
                        img = row.get('img', None),
                        defaults={
                            'price': Decimal(row.get('price', None)),
                            'memory_and_storage': row.get('Memory & Storage', ''),
                            'rear_camera': row.get('Rear Camera', ''),
                            'front_camera': row.get('Front Camera', ''),
                            'os_and_cpu': row.get('OS & CPU', ''),
                            'connectivity': row.get('Connectivity', ''),
                            'display': row.get('Display', ''),
                            'battery_and_charging': row.get('Battery & Charging', ''),
                            'design_and_weight': row.get('Design & Weight', ''),
                            'general_information': row.get('General Information', ''),
                            'utilities': row.get('Utilities', ''),
                            'product_overview': row.get('Product Overview', ''),

                            'warranty': row.get('warranty', ''),
                            'discount': row.get('discount') if isinstance(row.get('discount'), Decimal) else None,
                            # 'promotion_start_date': row.get('promotion_start_date', ''),
                            # 'promotion_end_date': row.get('promotion_end_date', ''),
                            # 'promotion_description': row.get('promotion_description', ''),
                            'description': row.get('description', ''),
                        }
                    )
                    if created:
                        self.stdout.write(f'Created Option: {product.name} - {opt.version} - {opt.color}')
                    else:
                        self.stdout.write(f'ℹ️ Option already exists: {opt.name}')
                except Exception as e:
                    print(e)

        self.stdout.write(self.style.SUCCESS("Import complete!"))
