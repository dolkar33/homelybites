from django.core.management.base import BaseCommand, CommandError
from recipes.models import Recipe
from recipes.utils import _similarities_tfidf, _build_recipe_text, preprocess

class Command(BaseCommand):
    help = "Print per-cuisine similarity scores for a recipe slug or raw text."

    def add_arguments(self, parser):
        parser.add_argument('--slug', type=str, default=None, help='Recipe slug to analyze')
        parser.add_argument('--text', type=str, default=None, help='Raw text to analyze (title/ingredients/instructions)')
        parser.add_argument('--top', type=int, default=8, help='Show top N cuisines')

    def handle(self, *args, **options):
        slug = options['slug']
        text = options['text']
        top = options['top']

        if not slug and not text:
            raise CommandError("Provide either --slug or --text")

        if slug:
            try:
                recipe = Recipe.objects.get(slug=slug)
            except Recipe.DoesNotExist:
                raise CommandError(f"Recipe with slug '{slug}' does not exist")
            doc = _build_recipe_text(recipe)
            self.stdout.write(self.style.NOTICE(f"Analyzing recipe '{slug}'"))
        else:
            doc = preprocess(text)
            self.stdout.write(self.style.NOTICE("Analyzing provided text"))

        try:
            from sklearn.feature_extraction.text import TfidfVectorizer  # noqa: F401
            using_sklearn = True
        except Exception:
            using_sklearn = False
        self.stdout.write(self.style.NOTICE(f"Using scikit-learn: {using_sklearn}"))

        scores = sorted(_similarities_tfidf(doc), key=lambda x: x[1], reverse=True)[:top]
        for lab, score in scores:
            self.stdout.write(f"{lab}: {score:.4f}")
