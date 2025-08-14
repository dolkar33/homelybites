import React, { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api, { baseURL } from "../config/axiosInstance";
import BackButton from "../components/BackButton";

const FavPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Shared loader so we can call from multiple places
  const fetchFavorites = async (isMountedRef = { current: true }) => {
    setLoading(true);
    try {
      const res = await api.get("api/recipes/favorites/");
      const data = res?.data;
      const items = Array.isArray(data) ? data : data?.results;
      if (isMountedRef.current) setFavorites(items || []);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      if (isMountedRef.current) setFavorites([]);
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  };

  // Load favorites on mount and keep in sync across pages/tabs
  useEffect(() => {
    const flag = { current: true };
    fetchFavorites(flag);

    const onFavsUpdated = () => fetchFavorites(flag);
    const onVisibility = () => {
      if (document.visibilityState === "visible") fetchFavorites(flag);
    };

    window.addEventListener("favorites:updated", onFavsUpdated);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      flag.current = false;
      window.removeEventListener("favorites:updated", onFavsUpdated);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // Function to navigate to recipe detail page (matching RecipeSearchPage)
  const goToRecipe = (slug) => {
    // Navigate to recipe details page using the recipe slug
    if (slug) {
      navigate(`/recipes/${slug}`);
    } else {
      navigate("/recipes"); // fallback
    }
  };

  // Function to remove from favorites (backend)
  const removeFromFavorites = async (recipeSlug) => {
    try {
      await api.delete(`api/recipes/${recipeSlug}/favorite/`);
      setFavorites((prev) => prev.filter((r) => r.slug !== recipeSlug));
    } catch (error) {
      console.error("Error removing from favorites:", error);
    }
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
          <BackButton />
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 lg:mb-10 text-center">
            My Favorite Recipes
          </h1>

          {favorites.length === 0 ? (
            <div className="text-center py-8 sm:py-10 lg:py-12 xl:py-16">
              <div className="max-w-md mx-auto">
                <div className="w-16 sm:w-20 lg:w-24 h-16 sm:h-20 lg:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <Heart
                    size={32}
                    className="sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-gray-400"
                  />
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-3 sm:mb-4">
                  No Favorites Yet
                </h3>
                <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
                  Start adding recipes to your favorites to see them here!
                </p>
                <button
                  onClick={() => navigate("/recipe")}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-red-400 text-white rounded-lg hover:bg-red-500 transition-colors font-medium"
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
                  className="bg-white rounded-lg shadow-md lg:shadow-lg p-3 sm:p-4 lg:p-5 xl:p-6 hover:shadow-lg lg:hover:shadow-xl transition-shadow flex gap-3 sm:gap-4 lg:gap-5 xl:gap-6"
                >
                  <div className="flex-shrink-0">
                    {(() => {
                      const raw = recipe.image || recipe.image_url || "";
                      const src = raw && (raw.startsWith("http") ? raw : `${baseURL}${raw}`);
                      return (
                        <img
                          src={src}
                          alt={recipe.alt || recipe.name || recipe.title}
                          className="w-16 sm:w-20 lg:w-24 xl:w-32 h-16 sm:h-20 lg:h-24 xl:h-32 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = "https://via.placeholder.com/150x150?text=Recipe";
                          }}
                        />
                      );
                    })()}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-h-0">
                    <div>
                      <div className="flex items-start justify-between mb-1 sm:mb-2">
                        <h3 className="font-bold text-sm sm:text-base lg:text-lg xl:text-xl leading-tight pr-2">
                          {recipe.name || recipe.title}
                        </h3>
                        <button
                          onClick={() => removeFromFavorites(recipe.slug)}
                          className="flex-shrink-0 p-1 hover:bg-gray-50 rounded-full transition-colors"
                          title="Remove from favorites"
                        >
                          <Heart
                            size={20}
                            className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 xl:w-8 xl:h-8 fill-red-500 text-red-500"
                          />
                        </button>
                      </div>

                      <div className="flex items-center mb-2 sm:mb-2 lg:mb-3">
                        <span className="text-xs sm:text-sm lg:text-base text-gray-600 ml-2">
                          {typeof recipe.difficulty === "string" && recipe.difficulty
                            ? `${recipe.difficulty.charAt(0).toUpperCase()}${recipe.difficulty.slice(1)}`
                            : ""}
                        </span>
                        <span className="text-xs sm:text-sm lg:text-base text-gray-400 mx-2">|</span>
                        <span className="text-xs sm:text-sm lg:text-base text-gray-600">
                          {recipe.calories}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-2 sm:mb-2 lg:mb-3">
                        {(() => {
                          // First try to get instructions for description (like SearchPage)
                          const instructions = recipe.instructions;
                          if (instructions && typeof instructions === "string") {
                            return instructions.length > 100
                              ? instructions.substring(0, 100) + "..."
                              : instructions;
                          }

                          // Fallback to other description fields if instructions not available
                          const desc =
                            recipe.description ||
                            recipe.summary ||
                            recipe.short_description ||
                            recipe.subtitle ||
                            recipe.about;

                          if (desc && typeof desc === "string") {
                            return desc.length > 100
                              ? desc.substring(0, 100) + "..."
                              : desc;
                          }

                          // Final fallback
                          return "Delicious recipe";
                        })()}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-2">
                        {Array.isArray(recipe.cuisines) && recipe.cuisines.length > 0 ? (
                          recipe.cuisines.map((cuisine) => (
                            <span
                              key={cuisine.id ?? cuisine.name}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {cuisine.name ?? String(cuisine)}
                            </span>
                          ))
                        ) : recipe.cuisineType ? (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                            {recipe.cuisineType}
                          </span>
                        ) : null}
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
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default FavPage;
