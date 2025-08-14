from typing import List, Tuple
from django.db import transaction
from slugify import slugify
from .models import Recipe, Cuisine
import re

# Domain stopwords and unit/technique words to downweight
STOPWORDS = set([
    'teaspoon','teaspoons','tsp','tablespoon','tablespoons','tbsp','cup','cups','ounce','ounces','oz','gram','grams','g','kg','ml','ltr','liter','liters',
    'minute','minutes','hour','hours','mix','stir','cook','bake','roast','serve','add','remove','set','combine','heat','pan','pot','skillet','oil','salt','pepper',
    'taste','water','fresh','finely','chopped','sliced','dice','diced','optional','medium','large','small'
])

# Simple synonym map
SYNONYMS = {
    'scallion': 'green onion', 'scallions': 'green onion', 'spring onion': 'green onion',
    'coriander': 'cilantro', 'cilantro': 'cilantro',
    'chilies': 'chili', 'chiles': 'chili', 'chilli': 'chili',
    'brown sugar': 'sugar', 'caster sugar': 'sugar',
    'soy': 'soy sauce',
}

UNITS_PATTERN = re.compile(r"\b(\d+[\/\.]?\d*|\d*\.?\d+)(\s*(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|g|gram|grams|kg|ml|l|liter|liters))?\b",
                           flags=re.IGNORECASE)

def preprocess(text: str) -> str:
    if not text:
        return ''
    s = text.lower()
    # remove quantities/units
    s = UNITS_PATTERN.sub(' ', s)
    # normalize punctuation
    s = re.sub(r"[^a-zA-Z\s]", " ", s)
    # apply synonyms (longer keys first)
    for k in sorted(SYNONYMS.keys(), key=len, reverse=True):
        s = s.replace(k, SYNONYMS[k])
    # remove extra spaces
    tokens = [t for t in s.split() if t and t not in STOPWORDS]
    return ' '.join(tokens)

# Expanded cuisine descriptors (tunable)
CUISINE_DESCRIPTORS = {
    "chinese": "soy sauce ginger garlic green onion scallion rice noodles stir fry sesame hoisin oyster sauce wok dumpling bok choy five spice sichuan doubanjiang shaoxing",
    "vietnamese": "fish sauce nuoc mam nuoc cham lime mint cilantro basil pho bun cha spring roll lemongrass rice vermicelli pickled daikon banh mi caramelized",
    "indian": "curry masala turmeric cumin coriander garam masala chili ghee dal biryani naan cardamom clove fenugreek mustard seed curry leaf tadka rogan josh korma",
    "korean": "gochujang kimchi sesame soy sauce garlic green onion scallion bulgogi bibimbap gochugaru rice doenjang banchan ssam perilla short rib",
    "american": "burger bbq barbecue fries ranch sandwich pancake waffle steak pie mac and cheese cheddar casserole cornbread biscuit gravy brisket meatloaf",
    "european": "pasta olive oil tomato basil parmesan risotto paella baguette stew roast butter cream bechamel roux gnocchi aioli",
    "mexican": "taco tortilla salsa cilantro lime jalapeno cumin chili beans queso enchilada guacamole ancho guajillo masa pozole adobo pastor asada",
    "thai": "fish sauce curry coconut milk lemongrass kaffir lime basil chili galangal pad thai nam pla prik krapow tom yum massaman panang",
}


def _build_recipe_text(recipe: Recipe) -> str:
    parts = [
        recipe.title or "",
        getattr(recipe, "ingredients", "") or "",
        getattr(recipe, "instructions", "") or "",
    ]
    # include category and existing cuisine names for extra signal
    try:
        parts.extend([c.name for c in recipe.categories.all()])
    except Exception:
        pass
    try:
        parts.extend([c.name for c in recipe.cuisines.all()])
    except Exception:
        pass
    raw = "\n".join([p for p in parts if p])
    return preprocess(raw)


def _similarities_tfidf(doc: str) -> List[Tuple[str, float]]:
    """Return list of (cuisine_slug, score) using TF-IDF cosine if available, else simple overlap ratio."""
    descriptors = list(CUISINE_DESCRIPTORS.items())
    labels = [k for k, _ in descriptors]
    texts = [preprocess(v) for _, v in descriptors]

    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        corpus = texts + [doc]
        vec = TfidfVectorizer(stop_words=None, ngram_range=(1,2))
        X = vec.fit_transform(corpus)
        desc_mat = X[:-1]
        doc_vec = X[-1]
        sims = cosine_similarity(desc_mat, doc_vec).ravel()
        return list(zip(labels, sims))
    except Exception:
        # Fallback: token overlap ratio
        import re
        def tokens(s: str):
            return set(re.findall(r"[a-zA-Z]+", s.lower()))
        dset = [tokens(t) for t in texts]
        tdoc = tokens(doc)
        scores = []
        for lab, tset in zip(labels, dset):
            inter = len(tset & tdoc)
            union = len(tset | tdoc) or 1
            scores.append((lab, inter / union))
        return scores


@transaction.atomic
def auto_assign_cuisines_for_recipe(recipe: Recipe, top_k: int = 2, threshold: float = 0.2) -> List[Cuisine]:
    """
    Compute cuisine similarity for a recipe and assign up to top_k cuisines
    whose score >= threshold. Returns the Cuisine objects assigned.
    Does not remove existing user-set cuisines; only adds missing ones.
    """
    doc = _build_recipe_text(recipe)
    if not doc.strip():
        return []

    scores = _similarities_tfidf(doc)
    scores.sort(key=lambda x: x[1], reverse=True)

    assigned: List[Cuisine] = []
    # Iterate over all scores, add up to top_k cuisines not already present
    for slug, score in scores:
        if score < threshold:
            continue
        name = slug.replace("-", " ").title()
        cuisine, _ = Cuisine.objects.get_or_create(slug=slugify(slug), defaults={"name": name})
        if not recipe.cuisines.filter(pk=cuisine.pk).exists():
            recipe.cuisines.add(cuisine)
            assigned.append(cuisine)
        if len(assigned) >= top_k:
            break
    return assigned


# ----------------------
# Prep/Cook time helpers
# ----------------------

# Regex for durations like: 20 min, 1 hr 30 min, 1h, 30m, 20-25 minutes
TIME_PATTERN = re.compile(
    r"(?P<num1>\d+)(?:\s*[-–]\s*(?P<num2>\d+))?\s*(?P<Unit>min|mins|minute|minutes|hr|hrs|hour|hours|h|m)\b",
    flags=re.IGNORECASE,
)

PREP_VERBS = {
    'prep','prepare','chop','dice','slice','mince','peel','grate','mix','whisk','marinate','season','measure','assemble','wash','rinse','soak'
}
COOK_VERBS = {
    'cook','bake','roast','grill','broil','saute','sauté','simmer','boil','steam','braise','sear','fry','deep fry','stir fry','poach','reduce'
}

def _normalize_minutes(value: float, unit: str) -> float:
    u = unit.lower()
    if u in ('hr','hrs','hour','hours','h'):
        return value * 60.0
    # default minutes
    return value

def _extract_durations(text: str) -> List[int]:
    """Extract list of minute values from free text, handling ranges (use midpoint)."""
    if not text:
        return []
    vals: List[int] = []
    for m in TIME_PATTERN.finditer(text):
        n1 = float(m.group('num1'))
        n2 = m.group('num2')
        unit = m.group('Unit')
        if n2:
            mid = (n1 + float(n2)) / 2.0
            mins = _normalize_minutes(mid, unit)
        else:
            mins = _normalize_minutes(n1, unit)
        vals.append(int(round(mins)))
    return vals

def parse_durations(text: str) -> dict:
    """Parse durations and return total minutes mentioned, without classifying type."""
    durations = _extract_durations(text)
    return {
        'total_minutes': int(sum(durations)) if durations else 0,
        'count': len(durations),
        'values': durations,
    }

def _split_sentences(text: str) -> List[str]:
    # Simple splitter by newline or period
    if not text:
        return []
    parts = re.split(r"[\n\.]+", text)
    # remove empties
    return [p.strip() for p in parts if p and p.strip()]

def estimate_times_for_recipe(recipe: Recipe) -> tuple[int, int]:
    """
    Estimate (prep_minutes, cook_minutes) using explicit durations and verb-based heuristics.
    1) If durations appear near prep verbs, add to prep; near cook verbs, add to cook.
    2) Otherwise, split totals heuristically based on verbs present.
    3) If no explicit durations, fallback to heuristics from counts of ingredients and steps.
    """
    title = recipe.title or ''
    ingredients = getattr(recipe, 'ingredients', '') or ''
    instructions = getattr(recipe, 'instructions', '') or ''

    prep_total = 0
    cook_total = 0

    # Analyze sentences in instructions
    for sent in _split_sentences(instructions):
        s_low = sent.lower()
        vals = _extract_durations(s_low)
        if not vals:
            continue
        if any(v in s_low for v in PREP_VERBS):
            prep_total += sum(vals)
        if any(v in s_low for v in COOK_VERBS):
            cook_total += sum(vals)
        # If neither matched, assign to cook by default (common in recipes)
        if not any(v in s_low for v in PREP_VERBS | COOK_VERBS):
            cook_total += sum(vals)

    # If nothing captured from instructions, look at title/ingredients
    if prep_total == 0 and cook_total == 0:
        combined = f"{title}\n{ingredients}\n{instructions}"
        tot = parse_durations(combined)['total_minutes']
        if tot > 0:
            # heuristic split: 30% prep, 70% cook
            prep_total = int(round(tot * 0.3))
            cook_total = int(round(tot * 0.7))

    # Fallback purely heuristic if still zero
    if prep_total == 0 and cook_total == 0:
        # Estimate from counts
        num_ingredients = max(1, len([ln for ln in ingredients.splitlines() if ln.strip()]))
        num_steps = max(1, len(_split_sentences(instructions)))
        # Base prep: ~ 0.8 min per ingredient + 0.5 per step
        prep_total = int(round(0.8 * num_ingredients + 0.5 * num_steps))
        # Base cook: depends on verbs
        ilow = instructions.lower()
        if any(v in ilow for v in {'braise','roast','bake','stew'}):
            cook_total = 60
        elif any(v in ilow for v in {'simmer','grill','boil'}):
            cook_total = 25
        elif any(v in ilow for v in {'saute','sauté','stir fry','sear','steam'}):
            cook_total = 12
        else:
            cook_total = 15

    # If we have some cook time but no prep, estimate a small prep baseline from ingredients/steps
    if cook_total > 0 and prep_total == 0:
        num_ingredients = max(1, len([ln for ln in ingredients.splitlines() if ln.strip()]))
        num_steps = max(1, len(_split_sentences(instructions)))
        prep_total = max(5, int(round(0.5 * num_ingredients + 0.5 * num_steps)))

    # Clamp to reasonable bounds
    prep_total = max(0, min(prep_total, 8 * 60))
    cook_total = max(0, min(cook_total, 12 * 60))
    return prep_total, cook_total
