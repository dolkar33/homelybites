import React, { useState, useEffect } from "react";
import { X, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import api, { baseURL } from "../config/axiosInstance";

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
                  className="bg-white rounded-lg shadow-md lg:shadow-lg p-4 sm:p-5 lg:p-6 hover:shadow-lg lg:hover:shadow-xl transition-shadow"
                >
                  <div className="flex gap-4 sm:gap-5 lg:gap-6">
                    <div className="flex-shrink-0">
                      {(() => {
                        const raw = recipe.image || recipe.image_url || "";
                        const src = raw && (raw.startsWith("http") ? raw : `${baseURL}${raw}`);
                        return (
                          <img
                            src={src}
                            alt={recipe.alt || recipe.name || recipe.title}
                            className="w-20 sm:w-24 lg:w-32 h-20 sm:h-24 lg:h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/150x150?text=Recipe";
                            }}
                          />
                        );
                      })()}
                    </div>

                    <div className="flex-1 flex flex-col justify-between min-h-0">
                      <div>
                        <div className="flex items-start justify-between mb-2 sm:mb-3">
                          <h3 className="font-bold text-lg sm:text-xl lg:text-2xl leading-tight pr-2">
                            {recipe.name || recipe.title}
                          </h3>
                          <button
                            onClick={() => removeFromFavorites(recipe.slug)}
                            className="flex-shrink-0 p-1 hover:bg-gray-50 rounded-full transition-colors"
                            title="Remove from favorites"
                          >
                            <X
                              size={24}
                              className="sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-gray-400 hover:text-red-400 transition-colors"
                            />
                          </button>
                        </div>

                        <div className="flex items-center mb-3 sm:mb-4">
                          <span className="text-sm sm:text-base text-gray-600">
                            {recipe.difficulty}
                          </span>
                          <span className="text-sm sm:text-base text-gray-400 mx-2">
                            |
                          </span>
                          <span className="text-sm sm:text-base text-gray-600">
                            {typeof recipe.calories === 'number' ? `${recipe.calories} cal` : (recipe.calories?.toString().includes('cal') ? recipe.calories : `${recipe.calories || ''} cal`)}
                          </span>
                          {recipe.cuisineType && (
                            <>
                              <span className="text-sm sm:text-base text-gray-400 mx-2">
                                |
                              </span>
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
                        <button
                          onClick={() => goToRecipe(recipe.slug)}
                          className="px-4 sm:px-5 lg:px-6 py-2 sm:py-2.5 text-sm sm:text-base bg-red-400 text-white rounded-md hover:bg-red-500 transition-colors"
                        >
                          Go to Recipe
                        </button>
                        <button
                          onClick={() => removeFromFavorites(recipe.slug)}
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
