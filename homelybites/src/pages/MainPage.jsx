import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import CategoryButton from "../components/CategoryButton";
import { Carousel, Row, Col } from "react-bootstrap";
import {
  getPopularRecipes,
  getRecentRecipes,
  getRecipesByCategory,
} from "../services/spoonacularAPI";

const categories = ["breakfast", "soup", "lunch", "dessert", "salad", "drink"];

const MainPage = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [popularRecipes, setPopularRecipes] = useState([]);
  const [recentRecipes, setRecentRecipes] = useState([]);

  // Fetch recipes by category with pagination
  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use Django backend API service for category-based recipes
        const data = await getRecipesByCategory(activeCategory, 8);

        // Transform Django backend data to match your component structure
        const transformedRecipes =
          data?.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
            image_url: recipe.image_url,
            description:
              recipe.description ||
              recipe.ingredients?.substring(0, 100) + "..." ||
              "Delicious recipe",
            difficulty: recipe.difficulty || "Medium",
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            slug: recipe.slug,
          })) || [];

        if (page === 1) {
          setRecipes(transformedRecipes);
        } else {
          setRecipes((prev) => [...prev, ...transformedRecipes]);
        }

        setHasMore(false); // Django pagination would need more complex handling
      } catch (err) {
        setError(
          err.message || "Failed to fetch recipes. Please try again later."
        );
        console.error("Error fetching recipes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [activeCategory, page]);

  // Fetch popular recipes using Django backend service
  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        const data = await getPopularRecipes(4);

        const transformedRecipes =
          data?.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
            image_url: recipe.image_url,
            description:
              recipe.description ||
              recipe.ingredients?.substring(0, 100) + "..." ||
              "Quick and delicious",
            difficulty: recipe.difficulty || "Easy",
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            slug: recipe.slug,
          })) || [];

        setPopularRecipes(transformedRecipes);
      } catch (err) {
        console.error("Error fetching popular recipes:", err);
        setPopularRecipes([]);
      }
    };

    fetchPopularRecipes();
  }, []);

  // Fetch recent recipes for "What others are cooking" section using Django backend service
  useEffect(() => {
    const fetchRecentRecipes = async () => {
      try {
        const data = await getRecentRecipes(8);

        const transformedRecipes =
          data?.map((recipe) => ({
            id: recipe.id,
            title: recipe.title,
            image_url: recipe.image_url,
            description:
              recipe.description ||
              recipe.ingredients?.substring(0, 100) + "..." ||
              "Trending recipe",
            difficulty: recipe.difficulty || "Medium",
            prep_time: recipe.prep_time,
            cook_time: recipe.cook_time,
            slug: recipe.slug,
          })) || [];

        setRecentRecipes(transformedRecipes);
      } catch (err) {
        console.error("Error fetching recent recipes:", err);
        setRecentRecipes([]);
      }
    };

    fetchRecentRecipes();
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setPage(1);
    setHasMore(true);
  };

  const renderRecipeCards = (recipeList, isLoading = false) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-lg mb-2"></div>
              <div className="bg-gray-200 h-4 w-3/4 rounded mb-2"></div>
              <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    if (error && recipeList === recipes) {
      return (
        <div className="text-red-500 text-center py-4 bg-red-50 rounded-lg">
          {error}
          <button
            onClick={() => {
              setPage(1);
              setError(null);
            }}
            className="ml-2 text-blue-500 hover:text-blue-700"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!recipeList.length) {
      return (
        <div className="text-center py-4 bg-gray-50 rounded-lg">
          No recipes found for this category.
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {recipeList.map((recipe, index) => (
            <RecipeCard
              key={recipe.id || index}
              image={recipe.image_url || recipe.image}
              title={recipe.title}
              description={
                recipe.description ||
                `${recipe.prep_time ? `Prep: ${recipe.prep_time}min` : ""}${
                  recipe.prep_time && recipe.cook_time ? " | " : ""
                }${recipe.cook_time ? `Cook: ${recipe.cook_time}min` : ""}` ||
                recipe.difficulty ||
                "Delicious recipe"
              }
              slug={recipe.slug}
              difficulty={recipe.difficulty}
              prepTime={recipe.prep_time}
              cookTime={recipe.cook_time}
            />
          ))}
        </div>
        {recipeList === recipes && hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={loadMore}
              disabled={loading}
              className="px-6 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark disabled:opacity-50"
            >
              {loading ? "Loading..." : "Load More"}
            </button>
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-white">
        <Navbar />
        {/* Hero Section */}
        <div className="max-w-5xl mx-auto w-full px-4 mt-[4.5vh]">
          <div className="rounded-3xl overflow-hidden w-full h-[30vh] md:h-[40vh] flex items-center justify-center bg-[#FDEBED] relative mb-[5vh]">
            <img
              src="/Images/HomePageImage/salad.jpg"
              alt="hero salad"
              className="object-cover w-full h-full"
              style={{ objectPosition: "center center" }}
            />
          </div>

          {/* Ready to Cook Title */}
          <div className="flex items-center w-full my-[3vh]">
            <div className="flex-1 border-t border-gray-300"></div>
            <div className="mx-4 text-2xl md:text-3xl font-semibold text-center">
              Ready to <span className="text-accent">Cook?</span>
            </div>
            <div className="flex-1 border-t border-gray-300"></div>
          </div>

          {/* Category Buttons */}
          <div className="flex flex-col items-center w-full mb-[3vh]">
            <div className="flex items-center w-full justify-center flex-wrap gap-y-2">
              {categories.map((cat) => (
                <CategoryButton
                  key={cat}
                  active={activeCategory === cat}
                  onClick={() => handleCategoryChange(cat)}
                >
                  {cat
                    .replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </CategoryButton>
              ))}
            </div>
          </div>

          {/* Popular Recipes */}
          <div className="mt-[6vh]">
            <h2 className="text-2xl md:text-3xl font-bold mb-[2vh] text-center md:text-left">
              Popular Recipes
            </h2>
            {renderRecipeCards(popularRecipes)}
          </div>

          {/* What others are cooking */}
          <div className="mt-[6vh] mb-[6vh]">
            <h2 className="text-2xl md:text-3xl font-bold mb-[2vh] text-center md:text-left">
              What others are cooking
            </h2>
            {renderRecipeCards(recentRecipes)}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default MainPage;
