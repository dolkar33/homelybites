import React, { useState, useEffect } from "react";
import { Heart, Star, ChevronLeft, X, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BackButton from "../components/BackButton";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const RecipeSearchPage = () => {
  const navigate = useNavigate();
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
      Caribbean: false,
      "Central American": false,
    },
    calories: {
      lowCal: false,
      midCal: false,
      highCal: false,
    },
    difficulty: {
      easy: false,
      medium: false,
      hard: false,
    },
  });

  // State for recipes and favorites
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    count: 0,
    next: null,
    previous: null,
    currentPage: 1,
  });

  // Initialize recipes - Start with empty array
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
    const newFilters = {
      ...filters,
      [category]: {
        ...filters[category],
        [item]: !filters[category][item],
      },
    };
    setFilters(newFilters);

    // Use setTimeout to ensure state is updated before search
    setTimeout(() => {
      handleSearch(selectedIngredients, 1, newFilters);
    }, 0);
  };

  // Function to clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      cuisineType: {
        Italian: false,
        Indian: false,
        Thai: false,
        Turkish: false,
        Caribbean: false,
        "Central American": false,
      },
      calories: {
        lowCal: false,
        midCal: false,
        highCal: false,
      },
      difficulty: {
        easy: false,
        medium: false,
        hard: false,
      },
    };
    setFilters(clearedFilters);

    // Use setTimeout to ensure state is updated before search
    setTimeout(() => {
      handleSearch(selectedIngredients, 1, clearedFilters);
    }, 0);
  };

  // Function to toggle favorites
  const toggleFavorite = (recipeId) => {
    const newFavorites = new Set(favorites);
    const recipeToToggle = recipes.find((r) => r.id === recipeId);
    let updatedFavoriteRecipes = [];

    // Load existing favorites from localStorage
    const savedFavorites = localStorage.getItem("favoriteRecipeDetails");
    if (savedFavorites) {
      updatedFavoriteRecipes = JSON.parse(savedFavorites);
    }

    if (newFavorites.has(recipeId)) {
      newFavorites.delete(recipeId);
      // Remove from localStorage
      updatedFavoriteRecipes = updatedFavoriteRecipes.filter(r => r.id !== recipeId);
    } else {
      newFavorites.add(recipeId);
      // Add to localStorage if not already present
      if (recipeToToggle && !updatedFavoriteRecipes.some(r => r.id === recipeId)) {
        // Save minimal data or all relevant fields
        updatedFavoriteRecipes.push(recipeToToggle);
      }
    }
    // Save updated favorites to localStorage
    localStorage.setItem("favoriteRecipeDetails", JSON.stringify(updatedFavoriteRecipes));
    setFavorites(newFavorites);
  };


  // Function to build API URL with filters
  const buildApiUrl = (
    ingredients = selectedIngredients,
    page = 1,
    filtersToUse = filters
  ) => {
    const baseUrl = "http://localhost:8000/api/recipes/";
    const params = new URLSearchParams();

    // Add ingredients as search parameter if any
    if (ingredients.length > 0) {
      params.append("search", ingredients.join(","));
    }

    // Add calorie filters
    const selectedCalories = Object.keys(filtersToUse.calories).filter(
      (key) => filtersToUse.calories[key]
    );

    // Handle multiple calorie selections properly
    if (selectedCalories.length > 0) {
      if (
        selectedCalories.includes("lowCal") &&
        selectedCalories.length === 1
      ) {
        params.append("max_calories", "300");
      } else if (
        selectedCalories.includes("midCal") &&
        selectedCalories.length === 1
      ) {
        params.append("min_calories", "300");
        params.append("max_calories", "600");
      } else if (
        selectedCalories.includes("highCal") &&
        selectedCalories.length === 1
      ) {
        params.append("min_calories", "600");
      } else {
        // Multiple selections - find the range
        let minCal = 0;
        let maxCal = 10000; // High number as max

        if (selectedCalories.includes("lowCal")) {
          maxCal = Math.min(maxCal, 300);
        }
        if (selectedCalories.includes("midCal")) {
          minCal = Math.max(
            minCal,
            selectedCalories.includes("lowCal") ? 0 : 300
          );
          maxCal = selectedCalories.includes("highCal")
            ? 10000
            : Math.min(maxCal, 600);
        }
        if (selectedCalories.includes("highCal")) {
          minCal = Math.max(
            minCal,
            selectedCalories.includes("midCal") ? 300 : 600
          );
        }

        if (minCal > 0) params.append("min_calories", minCal.toString());
        if (maxCal < 10000) params.append("max_calories", maxCal.toString());
      }
    }

    // Add difficulty filters
    const selectedDifficulties = Object.keys(filtersToUse.difficulty).filter(
      (key) => filtersToUse.difficulty[key]
    );
    selectedDifficulties.forEach((difficulty) => {
      params.append("difficulty", difficulty);
    });

    // Add cuisine filters - check if your API supports this parameter
    const selectedCuisines = Object.keys(filtersToUse.cuisineType).filter(
      (key) => filtersToUse.cuisineType[key]
    );
    selectedCuisines.forEach((cuisine) => {
      // Try different parameter names based on your API
      params.append("cuisine", cuisine.toLowerCase().replace(" ", "_"));
    });

    // Add pagination
    if (page > 1) {
      params.append("page", page.toString());
    }

    return `${baseUrl}?${params.toString()}`;
  };

  // Function to handle search with real API
  const handleSearch = async (
    ingredients = selectedIngredients,
    page = 1,
    filtersToUse = filters
  ) => {
    // If no ingredients are selected and no filters are applied, clear the recipes
    const hasFilters =
      Object.values(filtersToUse.cuisineType).some(Boolean) ||
      Object.values(filtersToUse.calories).some(Boolean) ||
      Object.values(filtersToUse.difficulty).some(Boolean);

    if (ingredients.length === 0 && !hasFilters) {
      setRecipes([]);
      setPagination({ count: 0, next: null, previous: null, currentPage: 1 });
      return;
    }

    setLoading(true);

    try {
      const apiUrl = buildApiUrl(ingredients, page, filtersToUse);
      console.log("Fetching from:", apiUrl); // For debugging

      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add any authentication headers if needed
          // 'Authorization': 'Bearer your-token-here',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Transform API data to match our component's expected format
      const transformedRecipes = data.results.map((recipe) => ({
        id: recipe.id,
        name: recipe.title,
        image: recipe.image_url,
        rating: 4.0, // Default rating since API doesn't provide it
        difficulty: recipe.difficulty,
        calories: `${recipe.calories} cal`,
        cuisineType:
          recipe.cuisines.length > 0
            ? recipe.cuisines[0].name
            : "International",
        description: recipe.instructions
          ? recipe.instructions.substring(0, 100) + "..."
          : "Delicious recipe",
        nutritionInfo: {
          calories: recipe.calories,
          fat: recipe.fat,
          sugar: recipe.sugar,
          protein: recipe.protein,
          carbohydrates: recipe.carbohydrates,
        },
        categories: recipe.categories,
        cuisines: recipe.cuisines,
        instructions: recipe.instructions,
        slug: recipe.slug,
      }));

      if (page === 1) {
        setRecipes(transformedRecipes);
      } else {
        setRecipes((prev) => [...prev, ...transformedRecipes]);
      }

      setPagination({
        count: data.count,
        next: data.next,
        previous: data.previous,
        currentPage: page,
      });
    } catch (error) {
      console.error("Search failed:", error);
      // Show user-friendly error message
      setRecipes([]);
      alert(
        "Failed to search recipes. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to navigate to recipe details
  const goToRecipe = (slug) => {
    // Navigate to recipe details page using the recipe ID
    if (slug) {
      navigate(`/recipes/${slug}`);
    } else {
      navigate("/recipes"); // fallback
    }
  };

  // Function to load more recipes (pagination)
  const loadMoreRecipes = () => {
    if (pagination.next && !loading) {
      handleSearch(selectedIngredients, pagination.currentPage + 1);
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

  useEffect(() => {
    const alertShown = sessionStorage.getItem("alertShown");
    if (!alertShown) {
      alert(
        "Welcome to Smart Recipe Search! Add Ingredients to find delicious recipes."
      );
      sessionStorage.setItem("alertShown", "true");
    }
  }, []);

  // Load favorites from storage
  useEffect(() => {
    // Using in-memory storage for this environment
    setFavorites(new Set());
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Back Button at the top */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <BackButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full px-3 sm:px-4 lg:px-6 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 xl:gap-6">
            {/* Filter Section */}
            <div className="w-full lg:w-64 xl:w-72 flex-shrink-0 mb-4">
              <div className="bg-white rounded-lg lg:rounded-2xl xl:rounded-3xl shadow-md lg:shadow-lg p-3 sm:p-4 lg:p-5 xl:p-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold mb-3 sm:mb-4 lg:mb-6">
                  Filters
                </h2>

                {/* Cuisine Type */}
                <div className="mb-3 sm:mb-4 lg:mb-6">
                  <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
                    Cuisine Type
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                    {Object.keys(filters.cuisineType).map((cuisine) => (
                      <label key={cuisine} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.cuisineType[cuisine]}
                          onChange={() =>
                            handleFilterChange("cuisineType", cuisine)
                          }
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                        />
                        <span className="ml-2 sm:ml-3 text-xs sm:text-sm lg:text-base text-gray-700">
                          {cuisine}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Calories */}
                <div className="mb-3 sm:mb-4 lg:mb-6">
                  <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
                    Calories
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.calories.lowCal}
                        onChange={() =>
                          handleFilterChange("calories", "lowCal")
                        }
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                      />
                      <span className="ml-2 sm:ml-3 text-xs sm:text-sm lg:text-base text-gray-700">
                        Low Cal (&lt;300)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.calories.midCal}
                        onChange={() =>
                          handleFilterChange("calories", "midCal")
                        }
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                      />
                      <span className="ml-2 sm:ml-3 text-xs sm:text-sm lg:text-base text-gray-700">
                        Mid Cal(300-600)
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.calories.highCal}
                        onChange={() =>
                          handleFilterChange("calories", "highCal")
                        }
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                      />
                      <span className="ml-2 sm:ml-3 text-xs sm:text-sm lg:text-base text-gray-700">
                        High Cal (&gt;600)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Difficulty */}
                <div className="mb-3 sm:mb-4 lg:mb-6">
                  <h3 className="font-semibold text-sm sm:text-base lg:text-lg mb-2 sm:mb-3">
                    Difficulty
                  </h3>
                  <div className="space-y-1.5 sm:space-y-2 lg:space-y-3">
                    {Object.keys(filters.difficulty).map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.difficulty[level]}
                          onChange={() =>
                            handleFilterChange("difficulty", level)
                          }
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400 border-gray-300 rounded focus:ring-red-400"
                        />
                        <span className="ml-2 sm:ml-3 text-xs sm:text-sm lg:text-base text-gray-700">
                          {level.charAt(0).toUpperCase() + level.slice(1)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearFilters}
                  className="w-full py-2 sm:py-2.5 lg:py-3 px-3 sm:px-4 text-xs sm:text-sm lg:text-base bg-red-400 text-white rounded-lg lg:rounded-xl hover:bg-red-500 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Recipe Search Section */}
            <div className="flex-1 max-w-none lg:max-w-3xl">
              {/* Title outside the search box */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6 text-center">
                Smart Recipe Search by Ingredients
              </h1>

              <div className="mb-4 sm:mb-5 lg:mb-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mb-3 sm:mb-4">
                  <input
                    type="text"
                    placeholder="Add Ingredients..."
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addIngredient()}
                    className="flex-1 px-3 sm:px-4 lg:px-5 py-2 sm:py-3 lg:py-4 text-sm sm:text-base bg-white border-2 border-gray-300 rounded-lg shadow-sm lg:shadow-md focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
                  />
                  <button
                    onClick={addIngredient}
                    className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base bg-red-400 text-white rounded-lg shadow-sm lg:shadow-md hover:bg-red-500 hover:shadow-lg transition-all font-medium"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Ingredients */}
                <div className="flex flex-wrap gap-2 sm:gap-2 lg:gap-3">
                  {selectedIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm bg-red-400 text-white rounded-full shadow-sm"
                    >
                      {ingredient}
                      <button
                        onClick={() => removeIngredient(ingredient)}
                        className="ml-1.5 sm:ml-2 hover:bg-red-500 rounded-full p-0.5 sm:p-1 transition-colors"
                      >
                        <X size={12} className="sm:w-3.5 sm:h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Recipe Results */}
              {loading && recipes.length === 0 ? (
                <div className="text-center py-8 sm:py-10 lg:py-12 xl:py-16">
                  <div className="animate-spin rounded-full h-8 sm:h-10 lg:h-12 xl:h-16 w-8 sm:w-10 lg:w-12 xl:w-16 border-b-2 border-red-400 mx-auto"></div>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-600">
                    Searching recipes...
                  </p>
                </div>
              ) : selectedIngredients.length === 0 &&
                !Object.values(filters.cuisineType).some(Boolean) &&
                !Object.values(filters.calories).some(Boolean) &&
                !Object.values(filters.difficulty).some(Boolean) ? (
                <div className="text-center py-8 sm:py-10 lg:py-12 xl:py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-12 sm:w-14 lg:w-16 xl:w-20 h-12 sm:h-14 lg:h-16 xl:h-20 mx-auto mb-3 sm:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl sm:text-2xl lg:text-2xl xl:text-3xl">
                        🔍
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-2 lg:mb-3">
                      Start Your Recipe Search
                    </h3>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                      Add ingredients or use filters to discover delicious
                      recipes you can make.
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                      We assume that you already have salt and water.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Results count */}
                  {pagination.count > 0 && (
                    <div className="mb-4 text-sm text-gray-600">
                      Found {pagination.count} recipes
                    </div>
                  )}

                  <div className="space-y-3 sm:space-y-4 lg:space-y-5 xl:space-y-6 mb-4 sm:mb-5">
                    {recipes.map((recipe) => (
                      <div
                        key={recipe.id}
                        className="bg-white rounded-lg shadow-md lg:shadow-lg p-3 sm:p-4 lg:p-5 xl:p-6 hover:shadow-lg lg:hover:shadow-xl transition-shadow flex gap-3 sm:gap-4 lg:gap-5 xl:gap-6"
                      >
                        <div className="flex-shrink-0">
                          <img
                            src={recipe.image}
                            alt={recipe.name}
                            className="w-16 sm:w-20 lg:w-24 xl:w-32 h-16 sm:h-20 lg:h-24 xl:h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150x150?text=Recipe";
                            }}
                          />
                        </div>

                        <div className="flex-1 flex flex-col justify-between min-h-0">
                          <div>
                            <div className="flex items-start justify-between mb-1 sm:mb-2">
                              <h3 className="font-bold text-sm sm:text-base lg:text-lg xl:text-xl leading-tight pr-2">
                                {recipe.name}
                              </h3>
                              <button
                                onClick={() => toggleFavorite(recipe.id)}
                                className="flex-shrink-0 p-1 hover:bg-gray-50 rounded-full transition-colors"
                              >
                                <Heart
                                  size={20}
                                  className={`sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 ${
                                    favorites.has(recipe.id)
                                      ? "fill-red-500 text-red-500"
                                      : "text-gray-400"
                                  }`}
                                />
                              </button>
                            </div>

                            <div className="flex items-center mb-2 sm:mb-2 lg:mb-3">
                              <div className="flex mr-2">
                                {renderStars(recipe.rating)}
                              </div>
                              <span className="text-xs sm:text-sm lg:text-base text-gray-600 mr-2">
                                {recipe.rating}
                              </span>
                              <span className="text-xs sm:text-sm lg:text-base text-gray-400">
                                |
                              </span>
                              <span className="text-xs sm:text-sm lg:text-base text-gray-600 ml-2">
                                {recipe.difficulty.charAt(0).toUpperCase() +
                                  recipe.difficulty.slice(1)}
                              </span>
                              <span className="text-xs sm:text-sm lg:text-base text-gray-400 mx-2">
                                |
                              </span>
                              <span className="text-xs sm:text-sm lg:text-base text-gray-600">
                                {recipe.calories}
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-2 lg:mb-3">
                              {recipe.description}
                            </p>

                            {/* Cuisine and Categories */}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {recipe.cuisines.map((cuisine) => (
                                <span
                                  key={cuisine.id}
                                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                >
                                  {cuisine.name}
                                </span>
                              ))}
                            </div>
                          </div>

                          <button
                            onClick={() => goToRecipe(recipe.slug)}
                            className="self-start px-3 sm:px-4 lg:px-5 xl:px-6 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors"
                          >
                            Go to Recipe
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Load More Button */}
                  {pagination.next && (
                    <div className="text-center py-4">
                      <button
                        onClick={loadMoreRecipes}
                        disabled={loading}
                        className="px-6 py-3 bg-red-400 text-white rounded-lg hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {loading ? "Loading..." : "Load More Recipes"}
                      </button>
                    </div>
                  )}
                </>
              )}

              {recipes.length === 0 &&
                !loading &&
                (selectedIngredients.length > 0 ||
                  Object.values(filters.cuisineType).some(Boolean) ||
                  Object.values(filters.calories).some(Boolean) ||
                  Object.values(filters.difficulty).some(Boolean)) && (
                  <div className="text-center py-8 sm:py-10 lg:py-12 xl:py-16">
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                      No recipes found matching your criteria.
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-2 sm:mt-2 lg:mt-3">
                      Try adjusting your filters or ingredients.
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default RecipeSearchPage;