import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Heart, Star, ChevronLeft, X } from "lucide-react";

const RecipeSearchPage = () => {
  // State for ingredients input
  const [ingredientInput, setIngredientInput] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  // State for filters
  const [filters, setFilters] = useState({
    cuisineType: {
      Italian: false,
      Indian: false,
      Thai: false,
      Turkish: false,
      Afghanistan: false,
    },
    calories: {
      lowCal: false,
      midCal: false,
      highCal: false,
    },
    difficulty: {
      Easy: false,
      Medium: false,
      Hard: false,
    },
  });

  // State for recipes and favorites
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Mock recipe data (replace with API call)
  const mockRecipes = [
    {
      id: 1,
      name: "Chicken Tikka Masala",
      image:
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
      rating: 4.0,
      difficulty: "Easy",
      calories: "High Cal",
      cuisineType: "Indian",
      description: "Best Recipe for Chicken Tikka Masala with minimum things",
    },
    {
      id: 2,
      name: "Thai Style Noodles",
      image:
        "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
      rating: 4.0,
      difficulty: "Easy",
      calories: "Med Cal",
      cuisineType: "Thai",
      description: "Best Recipe for Thai Style Noodles with minimum things",
    },
    {
      id: 3,
      name: "Chicken Tikka Masala",
      image:
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
      rating: 4.0,
      difficulty: "Hard",
      calories: "High Cal",
      cuisineType: "Indian",
      description: "Best Recipe for Chicken Tikka Masala with minimum things",
    },
    {
      id: 4,
      name: "Chicken Tikka Masala",
      image:
        "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
      rating: 4.0,
      difficulty: "Medium",
      calories: "Med Cal",
      cuisineType: "Indian",
      description: "Best Recipe for Chicken Tikka Masala with minimum things",
    },
  ];

  // Initialize recipes - Start with empty array instead of mock data
  useEffect(() => {
    setRecipes([]);
  }, []);

  // Function to add ingredient
  const addIngredient = () => {
    if (
      ingredientInput.trim() &&
      !selectedIngredients.includes(ingredientInput.trim())
    ) {
      setSelectedIngredients([...selectedIngredients, ingredientInput.trim()]);
      setIngredientInput("");
      // Trigger search when ingredient is added
      handleSearch([...selectedIngredients, ingredientInput.trim()]);
    }
  };

  // Function to remove ingredient
  const removeIngredient = (ingredient) => {
    const newIngredients = selectedIngredients.filter(
      (item) => item !== ingredient
    );
    setSelectedIngredients(newIngredients);
    // Trigger search when ingredient is removed
    handleSearch(newIngredients);
  };

  // Function to handle filter changes
  const handleFilterChange = (category, item) => {
    setFilters((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [item]: !prev[category][item],
      },
    }));
    // Trigger search when filters change
    handleSearch(selectedIngredients);
  };

  // Function to clear all filters
  const clearFilters = () => {
    setFilters({
      cuisineType: {
        Italian: false,
        Indian: false,
        Thai: false,
        Turkish: false,
        Afghanistan: false,
      },
      calories: {
        lowCal: false,
        midCal: false,
        highCal: false,
      },
      difficulty: {
        Easy: false,
        Medium: false,
        Hard: false,
      },
    });
    handleSearch(selectedIngredients);
  };

  // Function to toggle favorites
  const toggleFavorite = (recipeId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
    } else {
      newFavorites.add(recipeId);
    }
    setFavorites(newFavorites);
  };

  // Function to handle search (connect to backend here)
  const handleSearch = async (ingredients = selectedIngredients) => {
    // If no ingredients are selected, clear the recipes
    if (ingredients.length === 0) {
      setRecipes([]);
      return;
    }

    setLoading(true);

    // Prepare search parameters for backend
    const searchParams = {
      ingredients: ingredients,
      filters: {
        cuisineTypes: Object.keys(filters.cuisineType).filter(
          (key) => filters.cuisineType[key]
        ),
        calories: Object.keys(filters.calories).filter(
          (key) => filters.calories[key]
        ),
        difficulties: Object.keys(filters.difficulty).filter(
          (key) => filters.difficulty[key]
        ),
      },
    };

    try {
      // Replace this with actual API call
      // const response = await fetch('/api/recipes/search', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(searchParams)
      // });
      // const data = await response.json();
      // setRecipes(data.recipes);

      // Mock filtering for demonstration
      let filteredRecipes = mockRecipes;

      // Filter by cuisine type
      const selectedCuisines = Object.keys(filters.cuisineType).filter(
        (key) => filters.cuisineType[key]
      );
      if (selectedCuisines.length > 0) {
        filteredRecipes = filteredRecipes.filter((recipe) =>
          selectedCuisines.includes(recipe.cuisineType)
        );
      }

      // Filter by calories
      const selectedCalories = Object.keys(filters.calories).filter(
        (key) => filters.calories[key]
      );
      if (selectedCalories.length > 0) {
        filteredRecipes = filteredRecipes.filter((recipe) => {
          const recipeCalType = recipe.calories.includes("Low")
            ? "lowCal"
            : recipe.calories.includes("Med")
            ? "midCal"
            : "highCal";
          return selectedCalories.includes(recipeCalType);
        });
      }

      // Filter by difficulty
      const selectedDifficulties = Object.keys(filters.difficulty).filter(
        (key) => filters.difficulty[key]
      );
      if (selectedDifficulties.length > 0) {
        filteredRecipes = filteredRecipes.filter((recipe) =>
          selectedDifficulties.includes(recipe.difficulty)
        );
      }

      setRecipes(filteredRecipes);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={`${
          i < Math.floor(rating)
            ? "fill-yellow-400 text-yellow-400"
            : "text-gray-300"
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Header */}
      <div className="bg-white shadow-sm px-4 sm:px-6 lg:px-8 py-4 ">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center mb-4">
            <button className="flex items-center text-gray-600 hover:text-gray-800 mr-4">
              <ChevronLeft size={20} className="text-accent" />
              <span className="ml-1 text-sm sm:text-base">Back</span>
            </button>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
            Smart Recipe Search by Ingredients
          </h1>

          {/* Search Input */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              type="text"
              placeholder="Added Ingredients..."
              value={ingredientInput}
              onChange={(e) => setIngredientInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addIngredient()}
              className="flex-1 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
            />
            <button
              onClick={addIngredient}
              className="px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base bg-accent text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
            >
              Add
            </button>
          </div>

          {/* Selected Ingredients */}
          <div className="flex flex-wrap gap-2">
            {selectedIngredients.map((ingredient) => (
              <span
                key={ingredient}
                className="inline-flex items-center px-2 sm:px-3 py-1 text-xs sm:text-sm bg-red-400 text-white rounded-full"
              >
                {ingredient}
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="ml-2 hover:bg-red-500 rounded-full p-0.5 sm:p-1"
                >
                  <X size={12} className="sm:w-3.5 sm:h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Filters Sidebar */}
          <div className="lg:w-72 xl:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 sticky top-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">
                Filters
              </h2>

              {/* Cuisine Type */}
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                  Cuisine Type
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {Object.keys(filters.cuisineType).map((cuisine) => (
                    <label key={cuisine} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.cuisineType[cuisine]}
                        onChange={() =>
                          handleFilterChange("cuisineType", cuisine)
                        }
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent border-gray-300 rounded focus:ring-red-400 accent-accent"
                      />
                      <span className="ml-2 text-sm sm:text-base text-gray-700">
                        {cuisine}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Calories */}
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                  Calories
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.calories.lowCal}
                      onChange={() => handleFilterChange("calories", "lowCal")}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                    />
                    <span className="ml-2 text-sm sm:text-base text-gray-700">
                      Low Cal (&lt;300)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.calories.midCal}
                      onChange={() => handleFilterChange("calories", "midCal")}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                    />
                    <span className="ml-2 text-sm sm:text-base text-gray-700">
                      Mid Cal(300-600)
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.calories.highCal}
                      onChange={() => handleFilterChange("calories", "highCal")}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-accent border-gray-300 rounded focus:ring-red-400"
                    />
                    <span className="ml-2 text-sm sm:text-base text-gray-700">
                      High Cal (&gt;600)
                    </span>
                  </label>
                </div>
              </div>

              {/* Difficulty */}
              <div className="mb-4 sm:mb-6">
                <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">
                  Difficulty
                </h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {Object.keys(filters.difficulty).map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.difficulty[level]}
                        onChange={() => handleFilterChange("difficulty", level)}
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                      />
                      <span className="ml-2 text-sm sm:text-base text-gray-700">
                        {level}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Clear Filters Button */}
              <button
                onClick={clearFilters}
                className="w-full py-2 px-4 text-sm sm:text-base bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Recipe Results */}
          <div className="flex-1">
            {loading ? (
              <div className="text-center py-8 sm:py-12">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-red-400 mx-auto"></div>
                <p className="mt-4 text-sm sm:text-base text-gray-600">
                  Searching recipes...
                </p>
              </div>
            ) : selectedIngredients.length === 0 ? (
              <div className="text-center py-8 sm:py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Start Your Recipe Search
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Add ingredients to discover delicious recipes you can make
                    with what you have.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {recipes.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative">
                      <img
                        src={recipe.image}
                        alt={recipe.name}
                        className="w-full h-40 sm:h-48 object-cover"
                      />
                      <button
                        onClick={() => toggleFavorite(recipe.id)}
                        className="absolute top-2 sm:top-3 right-2 sm:right-3 p-1.5 sm:p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
                      >
                        <Heart
                          size={18}
                          className={`${
                            favorites.has(recipe.id)
                              ? "fill-red-500 text-red-500"
                              : "text-gray-400"
                          }`}
                        />
                      </button>
                    </div>

                    <div className="p-3 sm:p-4">
                      <h3 className="font-bold text-base sm:text-lg mb-2">
                        {recipe.name}
                      </h3>

                      <div className="flex items-center mb-2">
                        <div className="flex mr-2">
                          {renderStars(recipe.rating)}
                        </div>
                        <span className="text-xs sm:text-sm text-gray-600 mr-2">
                          {recipe.rating}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400">
                          |
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600 ml-2">
                          {recipe.difficulty}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-400 mx-2">
                          |
                        </span>
                        <span className="text-xs sm:text-sm text-gray-600">
                          {recipe.calories}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                        {recipe.description}
                      </p>

                      <button className="w-full py-1.5 sm:py-2 px-3 sm:px-4 text-sm sm:text-base bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors">
                        Go to Recipe
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recipes.length === 0 &&
              !loading &&
              selectedIngredients.length > 0 && (
                <div className="text-center py-8 sm:py-12">
                  <p className="text-sm sm:text-base text-gray-600">
                    No recipes found matching your criteria.
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-2">
                    Try adjusting your filters or ingredients.
                  </p>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeSearchPage;
