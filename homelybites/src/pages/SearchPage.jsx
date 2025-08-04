import React, { useState, useEffect } from "react";
import { Heart, Star, ChevronLeft, X, User } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";

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
    const recipeToToggle = recipes.find((r) => r.id === recipeId);
  
    let favoriteDetails = JSON.parse(localStorage.getItem("favoriteRecipeDetails") || "[]");
    let favoriteIds = JSON.parse(localStorage.getItem("favoriteRecipes") || "[]");
  
    if (newFavorites.has(recipeId)) {
      // Remove from favorites
      newFavorites.delete(recipeId);
      favoriteDetails = favoriteDetails.filter((r) => r.id !== recipeId);
      favoriteIds = favoriteIds.filter((id) => id !== recipeId);
    } else {
      // Add to favorites
      newFavorites.add(recipeId);
      if (recipeToToggle && !favoriteDetails.find((r) => r.id === recipeId)) {
        favoriteDetails.push(recipeToToggle);
      }
      if (!favoriteIds.includes(recipeId)) {
        favoriteIds.push(recipeId);
      }
    }
  
    // Update states and localStorage
    setFavorites(newFavorites);
    localStorage.setItem("favoriteRecipeDetails", JSON.stringify(favoriteDetails));
    localStorage.setItem("favoriteRecipes", JSON.stringify(favoriteIds));
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

  useEffect(() => {
    const alertShown = sessionStorage.getItem("aleartShown");
    if (!alertShown) {
      alert(
        "Welcome to Smart Recipe Search! Add Ingredients to find delicious recipes."
      );
      sessionStorage.setItem("aleartShown", "true");
    }
  }, []);
  
  // Loads favorites from localStorage. 
  useEffect(() => {
    const savedFavorites = JSON.parse(localStorage.getItem("favoriteRecipes") || "[]");
    setFavorites(new Set(savedFavorites));
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
            {/* Filter Section - Made smaller and more responsive */}
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
                          {level}
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

            {/* Recipe Search Section - Now takes up remaining space with right margin */}
            <div className="flex-1 max-w-none lg:max-w-3xl">
              {/* Title outside the search box */}
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6 text-center">
                Smart Recipe Search by Ingredients
              </h1>

              <div className="mb-4 sm:mb-5 lg:mb-6">
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-2 mb-3 sm:mb-4">
                  <input
                    type="text"
                    placeholder="Added Ingredients..."
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
              {loading ? (
                <div className="text-center py-8 sm:py-10 lg:py-12 xl:py-16">
                  <div className="animate-spin rounded-full h-8 sm:h-10 lg:h-12 xl:h-16 w-8 sm:w-10 lg:w-12 xl:w-16 border-b-2 border-red-400 mx-auto"></div>
                  <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-600">
                    Searching recipes...
                  </p>
                </div>
              ) : selectedIngredients.length === 0 ? (
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
                      Add ingredients to discover delicious recipes you can make
                      with what you have.
                    </p>
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                      We assume that you already have salt and water.
                    </p>
                  </div>
                </div>
              ) : (
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
                              {recipe.difficulty}
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
                        </div>

                        <button className="self-start px-3 sm:px-4 lg:px-5 xl:px-6 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors">
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