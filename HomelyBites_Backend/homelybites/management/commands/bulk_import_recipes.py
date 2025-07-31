from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Import multiple recipe categories at once.'

    def handle(self, *args, **kwargs):
        queries = ['soup', 'lunch', 'dessert', 'salad', 'drink']
        for query in queries:
            self.stdout.write(f"Importing {query} recipes...")
            call_command('import_recipes', query=query, number=10)
        self.stdout.write(self.style.SUCCESS("All recipes imported successfully!"))
