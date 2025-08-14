from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.db.models import Q
from recipes.models import Recipe
from recipes.utils import estimate_times_for_recipe

class Command(BaseCommand):
    help = "Estimate prep_time and cook_time for recipes from text. Preview by default; use --apply to write."

    def add_arguments(self, parser):
        parser.add_argument('--slug', type=str, default=None, help='Single recipe slug to process')
        parser.add_argument('--only-missing', action='store_true', help='Process only recipes with missing times')
        parser.add_argument('--limit', type=int, default=100, help='Max number of recipes to process in bulk')
        parser.add_argument('--apply', action='store_true', help='Persist estimated times to the database')

    def handle(self, *args, **options):
        slug = options['slug']
        only_missing = options['only-missing']
        limit = options['limit']
        do_apply = options['apply']

        if slug:
            qs = Recipe.objects.filter(slug=slug)
            if not qs.exists():
                raise CommandError(f"Recipe with slug '{slug}' does not exist")
        else:
            qs = Recipe.objects.all()
            if only_missing:
                qs = qs.filter(Q(prep_time__isnull=True) | Q(cook_time__isnull=True))
            qs = qs.order_by('id')[:limit]

        count = 0
        to_update = []
        for r in qs:
            prep, cook = estimate_times_for_recipe(r)
            self.stdout.write(f"{r.slug}: prep={prep} min, cook={cook} min")
            if do_apply:
                # Only set if missing or zero to avoid overwriting manual entries
                changed = False
                if getattr(r, 'prep_time', None) in (None, 0):
                    r.prep_time = prep
                    changed = True
                if getattr(r, 'cook_time', None) in (None, 0):
                    r.cook_time = cook
                    changed = True
                if changed:
                    to_update.append(r)
            count += 1

        if do_apply and to_update:
            with transaction.atomic():
                Recipe.objects.bulk_update(to_update, ['prep_time', 'cook_time'])
            self.stdout.write(self.style.SUCCESS(f"Updated {len(to_update)} recipes."))
        else:
            self.stdout.write(self.style.NOTICE(f"Processed {count} recipes (preview mode). Use --apply to save."))
