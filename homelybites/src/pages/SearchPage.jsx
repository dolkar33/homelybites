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

  useEffect(() => {
    const alertShown = sessionStorage.getItem("aleartShown");
    if (!alertShown) {
      alert(
        "Welcome to Smart Recipe Search! Add Ingredients to find delicious recipes."
      );
      sessionStorage.setItem("aleartShown", "true");
    }
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {/* Back Button at the top */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto">
          <BackButton />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4 xl:gap-6">
            {/* Filter Section Starting  */}
            <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 mb-6">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8">
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6 lg:mb-8">
                  Filters
                </h2>

                {/* Cuisine Type */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h3 className="font-semibold text-base sm:text-lg lg:text-xl mb-2 sm:mb-3 lg:mb-4">
                    Cuisine Type
                  </h3>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {Object.keys(filters.cuisineType).map((cuisine) => (
                      <label key={cuisine} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.cuisineType[cuisine]}
                          onChange={() =>
                            handleFilterChange("cuisineType", cuisine)
                          }
                          className="w-4 h-4 sm:w-5 sm:h-5"
                        />
                        <span className="ml-3 text-sm sm:text-base lg:text-lg text-gray-700">
                          {cuisine}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Calories */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h3 className="font-semibold text-base sm:text-lg lg:text-xl mb-2 sm:mb-3 lg:mb-4">
                    Calories
                  </h3>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.calories.lowCal}
                        onChange={() =>
                          handleFilterChange("calories", "lowCal")
                        }
                        className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 border-gray-300 rounded focus:ring-red-400"
                      />
                      <span className="ml-3 text-sm sm:text-base lg:text-lg text-gray-700">
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
                        className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 border-gray-300 rounded focus:ring-red-400"
                      />
                      <span className="ml-3 text-sm sm:text-base lg:text-lg text-gray-700">
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
                        className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 border-gray-300 rounded focus:ring-red-400"
                      />
                      <span className="ml-3 text-sm sm:text-base lg:text-lg text-gray-700">
                        High Cal (&gt;600)
                      </span>
                    </label>
                  </div>
                </div>

                {/* Difficulty */}
                <div className="mb-4 sm:mb-6 lg:mb-8">
                  <h3 className="font-semibold text-base sm:text-lg lg:text-xl mb-2 sm:mb-3 lg:mb-4">
                    Difficulty
                  </h3>
                  <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {Object.keys(filters.difficulty).map((level) => (
                      <label key={level} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.difficulty[level]}
                          onChange={() =>
                            handleFilterChange("difficulty", level)
                          }
                          className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 border-gray-300 rounded focus:ring-red-400"
                        />
                        <span className="ml-3 text-sm sm:text-base lg:text-lg text-gray-700">
                          {level}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={clearFilters}
                  className="w-full py-2 sm:py-3 lg:py-4 px-4 text-sm sm:text-base lg:text-lg bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>

            {/* Recipe Search Section */}
            <div className="flex-1">
              {/* Search Header */}
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6">
                <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">
                  Smart Recipe Search by Ingredients
                </h1>

                {/* Search Input */}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <input
                    type="text"
                    placeholder="Added Ingredients..."
                    value={ingredientInput}
                    onChange={(e) => setIngredientInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && addIngredient()}
                    className="flex-1 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={addIngredient}
                    className="px-4 sm:px-6 lg:px-8 py-2 sm:py-3 lg:py-4 text-sm sm:text-base lg:text-lg bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
                  >
                    Add
                  </button>
                </div>

                {/* Selected Ingredients */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {selectedIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="inline-flex items-center px-2 sm:px-3 lg:px-4 py-1 sm:py-1.5 text-xs sm:text-sm lg:text-base bg-red-400 text-white rounded-full"
                    >
                      {ingredient}
                      <button
                        onClick={() => removeIngredient(ingredient)}
                        className="ml-2 hover:bg-red-500 rounded-full p-1"
                      >
                        <X
                          size={12}
                          className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4"
                        />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Recipe Results */}
              {loading ? (
                <div className="text-center py-8 sm:py-12 lg:py-16 ">
                  <div className="animate-spin rounded-full h-10 sm:h-12 lg:h-16 w-10 sm:w-12 lg:w-16 border-b-2 border-red-400 mx-auto"></div>
                  <p className="mt-4 text-sm sm:text-base lg:text-lg text-gray-600">
                    Searching recipes...
                  </p>
                </div>
              ) : selectedIngredients.length === 0 ? (
                <div className="text-center py-8 sm:py-12 lg:py-16">
                  <div className="max-w-md mx-auto">
                    <div className="w-12 sm:w-16 lg:w-20 h-12 sm:h-16 lg:h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-xl sm:text-2xl lg:text-3xl">
                        🔍
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
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
                <div className="space-y-3 sm:space-y-4 lg:space-y-6 mb-5">
                  {recipes.map((recipe) => (
                    <div
                      key={recipe.id}
                      className="bg-white rounded-lg shadow-lg p-3 sm:p-4 lg:p-6 hover:shadow-xl transition-shadow flex gap-3 sm:gap-4 lg:gap-6"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 object-cover rounded-lg"
                        />
                      </div>

                      <div className="flex-1 flex flex-col justify-between min-h-0">
                        <div>
                          <div className="flex items-start justify-between mb-1 sm:mb-2">
                            <h3 className="font-bold text-sm sm:text-base lg:text-xl leading-tight pr-2">
                              {recipe.name}
                            </h3>
                            <button
                              onClick={() => toggleFavorite(recipe.id)}
                              className="flex-shrink-0 p-1 hover:bg-gray-50 rounded-full transition-colors"
                            >
                              <Heart
                                size={30}
                                className={`${
                                  favorites.has(recipe.id)
                                    ? "fill-red-500 text-red-500"
                                    : "text-gray-400"
                                }`}
                              />
                            </button>
                          </div>

                          <div className="flex items-center mb-2 sm:mb-3">
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

                          <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-3">
                            {recipe.description}
                          </p>
                        </div>

                        <button className="self-start px-3 sm:px-4 lg:px-6 py-1 sm:py-1.5 lg:py-2 text-xs sm:text-sm lg:text-base bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors">
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
                  <div className="text-center py-8 sm:py-12 lg:py-16">
                    <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                      No recipes found matching your criteria.
                    </p>
                    <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-2 sm:mt-3">
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
