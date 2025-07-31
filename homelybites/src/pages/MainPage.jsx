import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import CategoryButton from "../components/CategoryButton";
import { recipeAPI } from "../services/api";
import { Carousel, Row, Col } from "react-bootstrap";

const categories = [
  "breakfast",
  "soup",
  "lunch",
  "dessert",
  "salad",
  "drink",
];

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

        // For category-based filtering, we'll use the main recipes endpoint
        // Note: Your backend might need to support category filtering
        const response = await recipeAPI.getRecipes({
          category: activeCategory,
          page: page,
          limit: 8,
        });

        if (page === 1) {
          setRecipes(response.data.results || []);
        } else {
          setRecipes((prev) => [...prev, ...(response.data.results || [])]);
        }

        setHasMore(response.data.next !== null);
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

  const recommendedRecipes = [
    {
      id: 1,
      title: "Creamy Mushroom Pasta",
      ingredients: ["pasta", "mushrooms", "cream", "garlic"],
      instructions: "Boil pasta. Sauté mushrooms. Mix with cream and serve.",
      spoonacular_id: "12345",
      image: "/Images/Dummy/mushroom_pasta.jpg",
      tags: ["pasta", "vegetarian", "quick"],
    },
    {
      id: 2,
      title: "Avocado Toast",
      ingredients: ["bread", "avocado", "salt", "lemon"],
      instructions:
        "Toast bread. Smash avocado with salt and lemon. Spread and serve.",
      spoonacular_id: "67890",
      image: "/Images/Dummy/avocado_toast.jpg",
      tags: ["breakfast", "healthy", "vegan"],
    },
    {
      id: 3,
      title: "Berry Smoothie",
      ingredients: ["berries", "banana", "yogurt", "honey"],
      instructions: "Blend all ingredients until smooth. Serve chilled.",
      spoonacular_id: "54321",
      image: "/Images/Dummy/berry_smoothie.jpg",
      tags: ["drink", "healthy", "quick"],
    },
    {
      id: 4,
      title: "Chicken Stir Fry",
      ingredients: ["chicken", "veggies", "soy sauce", "garlic"],
      instructions:
        "Stir fry chicken and vegetables. Add soy sauce. Cook and serve.",
      spoonacular_id: "98765",
      image: "/Images/Dummy/chicken_stir_fry.jpg",
      tags: ["lunch", "protein", "asian"],
    },
  ];

  // Fetch popular recipes
  useEffect(() => {
    const fetchPopularRecipes = async () => {
      try {
        const response = await recipeAPI.getRecipes({
          sort: "popular",
          limit: 4,
        });
        setPopularRecipes(response.data.results || []);
      } catch (err) {
        console.error("Error fetching popular recipes:", err);
      }
    };

    fetchPopularRecipes();
  }, []);

  // Fetch recent recipes for "What others are cooking" section
  useEffect(() => {
    const fetchRecentRecipes = async () => {
      try {
        const response = await recipeAPI.getRecipes({
          sort: "recent",
          limit: 4,
        });
        setRecentRecipes(response.data.results || []);
      } catch (err) {
        console.error("Error fetching recent recipes:", err);
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

          {/* Recipes You Would Love */}

          <div className="mt-[4vh] mb-[6vh]">
            <h2 className="text-2xl md:text-3xl font-bold mb-[2vh] text-center md:text-left">
              Recipes You Would Love
            </h2>

            <Carousel>
              {recommendedRecipes
                .reduce((result, recipe, index) => {
                  if (index % 3 === 0) result.push([]);
                  result[result.length - 1].push(recipe);
                  return result;
                }, [])
                .map((group, idx) => (
                  <Carousel.Item key={idx}>
                    <Row className="justify-content-center">
                      {group.map((recipe) => (
                        <Col
                          md={4}
                          key={recipe.id}
                          className="d-flex justify-content-center mb-4"
                        >
                          <RecipeCard
                            key={recipe.id}
                            image={recipe.image}
                            title={recipe.title}
                            description={recipe.instructions}
                            slug={recipe.title
                              .toLowerCase()
                              .replace(/\s+/g, "-")}
                            difficulty={"Easy"}
                            prepTime={10}
                            cookTime={15}
                          />
                        </Col>
                      ))}
                    </Row>
                  </Carousel.Item>
                ))}
            </Carousel>
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
