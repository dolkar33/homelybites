const API_KEY = "f3c306b14ff948d2bdaaa9165d078e21";

// We'll use cuisine filters like Indian, Asian, and American (for basic Western)
const commonCuisine = "&cuisine=indian,asian,american";

const categories = [
  {
    id: "breakfast-list",
    url: `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=4&type=breakfast${commonCuisine}&addRecipeInformation=true`
  },
  {
    id: "quick-list",
    url: `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=4&maxReadyTime=20${commonCuisine}&addRecipeInformation=true`
  },
  {
    id: "lunches-list",
    url: `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=4&type=main%20course${commonCuisine}&addRecipeInformation=true`
  },
  {
    id: "desserts-list",
    url: `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=4&type=dessert${commonCuisine}&addRecipeInformation=true`
  },
  {
    id: "healthy-list",
    url: `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=4&diet=healthy${commonCuisine}&addRecipeInformation=true`
  },
  {
    id: "drinks-list",
    url: `https://api.spoonacular.com/recipes/complexSearch?apiKey=${API_KEY}&number=4&type=drink${commonCuisine}&addRecipeInformation=true`
  }
];

categories.forEach(category => {
  fetch(category.url)
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById(category.id);
      if (!container || !data.results) return;

      data.results.forEach(recipe => {
        const card = document.createElement("div");
        card.innerHTML = `
          <img src="${recipe.image}" alt="${recipe.title}" width="150"><br>
          <strong>${recipe.title}</strong><br>
          <a href="${recipe.sourceUrl}" target="_blank">View Recipe</a>
        `;
        container.appendChild(card);
      });
    })
    .catch(error => {
      console.error(`Error loading ${category.id} recipes:`, error);
    });
});
