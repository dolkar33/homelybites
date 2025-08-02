import requests

SPOONACULAR_API_KEY = 'f3c306b14ff948d2bdaaa9165d078e21'

def search_recipes(query, number=5):
    url = f"https://api.spoonacular.com/recipes/complexSearch"
    params = {
        'apiKey': SPOONACULAR_API_KEY,
        
        'query': query,
        'number': number,
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get('results', [])
    else:
        return []
