import React, { useState, useEffect } from "react";
import { Heart, Star, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FavPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock favorites data (fallback)
  const mockFavorites = [
    {
      id: 1,
      title: "Chicken Tikka Masala",
      image: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
      alt: "Chicken Tikka Masala",
      rating: 4.0,
      difficulty: "Easy",
      calories: "High Cal",
      cuisineType: "Indian",
      description: "Best Recipe for Chicken Tikka Masala with minimum things",
    },
    {
      id: 2,
      title: "Thai Style Noodles",
      image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop",
      alt: "Thai Style Noodles",
      rating: 4.0,
      difficulty: "Easy",
      calories: "Med Cal",
      cuisineType: "Thai",
      description: "Best Recipe for Thai Style Noodles with minimum things",
    },
  ];

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const loadFavorites = () => {
      try {
        const savedFavorites = localStorage.getItem("favoriteRecipeDetails");
        if (savedFavorites) {
          const parsedFavorites = JSON.parse(savedFavorites);
          setFavorites(parsedFavorites.length ? parsedFavorites : mockFavorites);
        } else {
          setFavorites(mockFavorites);
        }
      } catch (error) {
        console.error("Error loading favorites:", error);
        setFavorites(mockFavorites);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Function to remove from favorites
  const removeFromFavorites = (recipeId) => {
    try {
      // Update state
      const updatedFavorites = favorites.filter((recipe) => recipe.id !== recipeId);
      setFavorites(updatedFavorites);

      // Update localStorage
      localStorage.setItem("favoriteRecipeDetails", JSON.stringify(updatedFavorites));

      // Also update the favorites IDs list used by RecipeSearchPage
      const savedFavoriteIds = localStorage.getItem("favoriteRecipes");
      if (savedFavoriteIds) {
        const favoriteIds = JSON.parse(savedFavoriteIds);
        const updatedIds = favoriteIds.filter(id => id !== recipeId);
        localStorage.setItem("favoriteRecipes", JSON.stringify(updatedIds));
      }

      console.log("Recipe removed from favorites!");
    } catch (error) {
      console.error("Error removing from favorites:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center py-8 sm:py-10 lg:py-12 xl:py-16">
            <div className="animate-spin rounded-full h-8 sm:h-10 lg:h-12 xl:h-16 w-8 sm:w-10 lg:w-12 xl:w-16 border-b-2 border-red-400 mx-auto"></div>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-gray-600">
              Loading favorites...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      <div className="flex-1 w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 text-center">
            My Favorite Recipes
          </h1>

          {favorites.length === 0 ? (
            <div className="text-center py-8 sm:py-10 lg:py-12 xl:py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Heart size={32} className="sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400" />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  No Favorites Yet
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
                  Start adding recipes to your favorites to see them here!
                </p>
                <button 
                  onClick={() => window.history.back()}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-accent text-white rounded-lg hover:bg-accent transition-colors font-medium"
                >
                  Browse Recipes
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8">
              {favorites.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-lg shadow-md lg:shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-lg lg:hover:shadow-xl transition-shadow"
                >
                  <div className="flex gap-4 sm:gap-5 lg:gap-6">
                    <div className="flex-shrink-0">
                      <img
                        src={recipe.image}
                        alt={recipe.alt || recipe.title}
                        className="w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 object-cover rounded-lg"
                      />
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-h-0">
                      <div>
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <h3 className="font-bold text-lg sm:text-xl lg:text-2xl leading-tight pr-2">
                            {recipe.title}
                          </h3>
                          <button
                            onClick={() => removeFromFavorites(recipe.id)}
                            className="flex-shrink-0 p-1 hover:bg-gray-50 rounded-full transition-colors"
                            title="Remove from favorites"
                          >
                            <X
                              size={24}
                              className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-400 hover:text-accent transition-colors"
                            />
                          </button>
                        </div>

                        <div className="flex items-center mb-3 sm:mb-4">
                          <div className="flex mr-2">
                            {renderStars(recipe.rating)}
                          </div>
                          <span className="text-sm sm:text-base text-gray-600 mr-2">
                            {recipe.rating}
                          </span>
                          <span className="text-sm sm:text-base text-gray-400">|</span>
                          <span className="text-sm sm:text-base text-gray-600 ml-2">
                            {recipe.difficulty}
                          </span>
                          <span className="text-sm sm:text-base text-gray-400 mx-2">|</span>
                          <span className="text-sm sm:text-base text-gray-600">
                            {recipe.calories}
                          </span>
                          {recipe.cuisineType && (
                            <>
                              <span className="text-sm sm:text-base text-gray-400 mx-2">|</span>
                              <span className="text-sm sm:text-base text-gray-600">
                                {recipe.cuisineType}
                              </span>
                            </>
                          )}
                        </div>

                        <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5">
                          {recipe.description}
                        </p>
                      </div>

                      <div className="flex gap-2 sm:gap-3">
                        <button className="px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-accent text-white rounded-md hover:bg-red-400 transition-colors">
                          Go to Recipe
                        </button>
                        <button 
                          onClick={() => removeFromFavorites(recipe.id)}
                          className="px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default FavPage;