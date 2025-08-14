from django.core.management.base import BaseCommand, CommandError
from django.db.models import Count
from recipes.models import Recipe
from recipes.utils import auto_assign_cuisines_for_recipe

class Command(BaseCommand):
    help = "Auto-assign cuisine tags to recipes using TF-IDF similarity."

    def add_arguments(self, parser):
        parser.add_argument('--limit', type=int, default=100, help='Max number of recipes to process')
        parser.add_argument('--top-k', type=int, default=2, dest='top_k', help='Number of cuisines to assign per recipe')
        parser.add_argument('--threshold', type=float, default=0.2, help='Min similarity threshold for assignment')
        parser.add_argument('--only-missing', action='store_true', help='Process only recipes that currently have no cuisines')
        parser.add_argument('--slug', type=str, default=None, help='If provided, retag only this recipe slug')

    def handle(self, *args, **options):
        limit = options['limit']
        top_k = options['top_k']
        threshold = options['threshold']
        only_missing = options['only_missing']
        slug = options['slug']

        if slug:
            try:
                recipe = Recipe.objects.get(slug=slug)
            except Recipe.DoesNotExist:
                raise CommandError(f"Recipe with slug '{slug}' does not exist")
            assigned = auto_assign_cuisines_for_recipe(recipe, top_k=top_k, threshold=threshold)
            self.stdout.write(self.style.SUCCESS(f"Retagged {recipe.slug}: {[c.slug for c in assigned]}"))
            return

        qs = Recipe.objects.all()
        if only_missing:
            qs = qs.annotate(c_count=Count('cuisines')).filter(c_count=0)
        processed = 0
        updated = 0
        for recipe in qs.iterator():
            if processed >= limit:
                break
            assigned = auto_assign_cuisines_for_recipe(recipe, top_k=top_k, threshold=threshold)
            if assigned:
                updated += 1
            processed += 1
            if processed % 50 == 0:
                self.stdout.write(f"Processed {processed}... updated {updated}")
        self.stdout.write(self.style.SUCCESS(f"Done. Processed {processed}, updated {updated}."))
