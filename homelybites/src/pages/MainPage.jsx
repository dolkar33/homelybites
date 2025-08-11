import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import CategoryButton from "../components/CategoryButton";
import { recipeAPI } from "../services/MainPageURL";
import { Carousel, Row, Col } from "react-bootstrap";

// Define the specific categories we want to show
const desiredCategories = [
  "breakfast",
  "soup",
  "lunch",
  "dessert",
  "salad",
  "drink",
];

const MainPage = () => {
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);

  // Fetch categories from backend and filter to only desired ones
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await recipeAPI.getCategories();
        console.log("Raw API response:", response);
        console.log("Response data:", response.data);
        console.log("Response status:", response.status);

        const allCategories = response.data.results || [];
        console.log("All categories extracted:", allCategories);

        // Filter to only show the desired categories
        const filteredCategories = allCategories.filter((cat) => {
          const catNameLower = cat.name.toLowerCase();
          const catSlugLower = cat.slug.toLowerCase();

          // Check if any desired category matches this backend category
          return desiredCategories.some((desired) => {
            const desiredLower = desired.toLowerCase();

            // Direct name match
            if (catNameLower === desiredLower) return true;

            // Slug match
            if (catSlugLower === desiredLower) return true;

            // Handle breakfast variations (group Morning Meal and Brunch under breakfast)
            if (
              desiredLower === "breakfast" &&
              catNameLower.includes("morning")
            )
              return true;
            if (desiredLower === "breakfast" && catNameLower.includes("brunch"))
              return true;

            // Handle drink matching with beverage
            if (desiredLower === "drink" && catNameLower.includes("beverage"))
              return true;
            if (desiredLower === "drink" && catSlugLower.includes("beverage"))
              return true;

            return false;
          });
        });

        // Filter out Morning Meal and Brunch so they don't appear as separate buttons
        const finalCategories = filteredCategories.filter((cat) => {
          const catNameLower = cat.name.toLowerCase();
          return (
            !catNameLower.includes("morning") &&
            !catNameLower.includes("brunch")
          );
        });

        // Add missing categories as static buttons if they don't exist in backend
        const missingCategories = [];

        if (
          !finalCategories.some((cat) =>
            cat.name.toLowerCase().includes("salad")
          )
        ) {
          missingCategories.push({ id: 999, name: "Salad", slug: "salad" });
        }

        if (
          !finalCategories.some(
            (cat) =>
              cat.name.toLowerCase().includes("beverage") ||
              cat.name.toLowerCase().includes("drink")
          )
        ) {
          missingCategories.push({ id: 998, name: "Drink", slug: "drink" });
        }

        const allFinalCategories = [...finalCategories, ...missingCategories];

        console.log(
          "All categories from backend:",
          allCategories.map((c) => ({ name: c.name, slug: c.slug }))
        );
        console.log(
          "Filtered categories:",
          filteredCategories.map((c) => ({ name: c.name, slug: c.slug }))
        );
        console.log(
          "Final categories (buttons to display):",
          allFinalCategories.map((c) => ({ name: c.name, slug: c.slug }))
        );
        console.log("Desired categories:", desiredCategories);

        // If no categories are found, use fallback
        if (allFinalCategories.length === 0) {
          console.warn(
            "No categories matched desired categories, using fallback"
          );
          const fallbackCategories = [
            { id: 1, name: "Breakfast", slug: "breakfast" },
            { id: 2, name: "Soup", slug: "soup" },
            { id: 3, name: "Lunch", slug: "lunch" },
            { id: 4, name: "Dessert", slug: "dessert" },
            { id: 5, name: "Salad", slug: "salad" },
            { id: 6, name: "Drink", slug: "drink" },
          ];
          setCategories(fallbackCategories);
          setActiveCategory(fallbackCategories[0]);
        } else {
          setCategories(allFinalCategories);
          // Set the first category as active if available
          if (!activeCategory) {
            setActiveCategory(allFinalCategories[0]);
          }
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        // Fallback to default desired categories if API fails
        setCategories([
          { id: 1, name: "Breakfast", slug: "breakfast" },
          { id: 2, name: "Soup", slug: "soup" },
          { id: 3, name: "Lunch", slug: "lunch" },
          { id: 4, name: "Dessert", slug: "dessert" },
          { id: 5, name: "Salad", slug: "salad" },
          { id: 6, name: "Drink", slug: "drink" },
        ]);
        setActiveCategory({ id: 1, name: "Breakfast", slug: "breakfast" });
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchRecipesByCategory = async () => {
      if (!activeCategory) return; // Don't fetch if no category is selected

      setLoading(true);
      setError(null);

      try {
        // Reset recipes when category changes and it's page 1
        if (page === 1) {
          setRecipes([]);
        }

        // Use the category slug for backend filtering
        console.log(
          `🔍 Fetching recipes for category: ${activeCategory.name} (slug: ${activeCategory.slug})`
        );
        const response = await recipeAPI.getRecipeByCategory(
          activeCategory.slug,
          page
        );

        console.log(
          `📋 Recipes received for ${activeCategory.name}:`,
          response.data
        );

        let filteredRecipes = response.data || [];

        // Client-side filtering as backup if backend doesn't filter properly
        if (filteredRecipes.length > 0) {
          // Filter recipes that contain the current category
          filteredRecipes = filteredRecipes.filter((recipe) => {
            return (
              recipe.categories &&
              recipe.categories.some(
                (cat) =>
                  cat.name
                    .toLowerCase()
                    .includes(activeCategory.name.toLowerCase()) ||
                  cat.slug
                    .toLowerCase()
                    .includes(activeCategory.slug.toLowerCase())
              )
            );
          });
        }

        if (filteredRecipes && filteredRecipes.length > 0) {
          if (page === 1) {
            // First page - replace recipes
            setRecipes(filteredRecipes);
          } else {
            // Subsequent pages - append recipes
            setRecipes((prevRecipes) => [...prevRecipes, ...filteredRecipes]);
          }

          // Check if there are more pages
          setHasMore(filteredRecipes.length === 12); // Assuming 12 recipes per page
        } else {
          if (page === 1) {
            setRecipes([]);
          }
          setHasMore(false);
        }
      } catch (err) {
        console.error(`Error fetching ${activeCategory.name} recipes:`, err);
        const errorMessage = `Failed to load ${activeCategory.name} recipes. Please try again.`;
        setError(errorMessage);
        if (page === 1) {
          setRecipes([]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRecipesByCategory();
  }, [activeCategory, page]);

  // WhatOthersAreCooking Fetching PART ( NEw logic )
  useEffect(() => {
    const fetchWhatOthersAreCooking = async () => {
      try {
        const response = await recipeAPI.getWhatOthersAreCooking();
        const recipes = (response.data || []).slice(0, 8);
        setRecentRecipes(recipes); // Stores the fetched recipes in the state.
      } catch (err) {
        console.error("Error fetching 'What others are cooking' recipes:", err);
      }
    };

    fetchWhatOthersAreCooking();
  }, []);

  // 5. UserInteraction: Change category and load more recipes.
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
            {categories.length > 0 ? (
              <div className="flex items-center w-full justify-center flex-wrap gap-y-2">
                {categories.map((cat) => (
                  <CategoryButton
                    key={cat.id} // Unique key for each button.
                    active={activeCategory?.id === cat.id} // highlight the active button.
                    onClick={() => handleCategoryChange(cat)} // changes the active category when clicked.
                  >
                    {cat.name}
                  </CategoryButton>
                ))}
              </div>
            ) : (
              <div className="flex items-center w-full justify-center">
                <div className="animate-pulse">
                  <div className="bg-gray-200 h-10 w-24 rounded-lg mx-2"></div>
                  <div className="bg-gray-200 h-10 w-24 rounded-lg mx-2"></div>
                  <div className="bg-gray-200 h-10 w-24 rounded-lg mx-2"></div>
                </div>
              </div>
            )}
          </div>

          {/*Category Recipe Sections */}
          {activeCategory && (
            <div className="mt-[4vh] mb-[6vh]">
              <h2 className="text-2xl md:text-3xl font-bold mb-[2vh] text-center md:text-left">
                {activeCategory.name.charAt(0).toUpperCase() +
                  activeCategory.name.slice(1)}{" "}
                Recipes
              </h2>
              {renderRecipeCards(recipes, loading)}
            </div>
          )}

          {/* Recipes You Would Love */}
          <div className="mt-[4vh] mb-[6vh]">
            <h2 className="text-2xl md:text-3xl font-bold mb-[2vh] text-center md:text-left">
              Recipes You Would Love
            </h2>

            {recommendedRecipes.length > 0 ? (
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
                              image={recipe.image_url || "/Images/default.jpg"}
                              title={recipe.title}
                              description={
                                recipe.description ||
                                recipe.instructions ||
                                "No description available"
                              }
                              slug={
                                recipe.slug ||
                                recipe.title.toLowerCase().replace(/\s+/g, "-")
                              }
                              difficulty={recipe.difficulty || "Easy"}
                              prepTime={recipe.prep_time || 10}
                              cookTime={recipe.cook_time || 15}
                            />
                          </Col>
                        ))}
                      </Row>
                    </Carousel.Item>
                  ))}
              </Carousel>
            ) : (
              <div className="bg-gray-100 text-gray-600 text-center py-6 rounded-lg">
                Loading AI-based recommendations...
              </div>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default MainPage;
