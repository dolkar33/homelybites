import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import CategoryButton from "../components/CategoryButton";
import { recipeAPI } from "../services/MainPageURL";
import { Carousel, Row, Col } from "react-bootstrap";
import axios from "axios";

const categories = ["breakfast", "soup", "lunch", "dessert", "salad", "drink"];

// Map frontend categories to backend category names
const categoryMapping = {
  "breakfast": "Breakfast",
  "soup": "Soup", 
  "lunch": "Main Course",
  "dessert": "Dessert",
  "salad": "Salad",
  "drink": "Beverage"
};

const MainPage = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);

  

  useEffect(() => {
    const fetchRecipesByCategory = async () => {
      setLoading(true);
      setError(null);

      try {
        // Reset recipes when category changes and it's page 1
        if (page === 1) {
          setRecipes([]);
        }

        // Fixed: Use getRecipeByCategory (without 's')
        const mappedCategory = categoryMapping[activeCategory] || activeCategory;
        const response = await recipeAPI.getRecipeByCategory(
          mappedCategory,
          page
        );

        console.log(`📋 Recipes received for ${activeCategory} (mapped to ${mappedCategory}):`, response.data);
        console.log(`🔢 Number of recipes:`, response.data?.length || 0);

        let filteredRecipes = response.data || [];
        
        // Client-side filtering as backup if backend doesn't filter properly
        if (filteredRecipes.length > 0) {
          const categoryKeywords = {
            "breakfast": ["breakfast", "morning", "brunch"],
            "soup": ["soup"],
            "lunch": ["main course", "lunch", "main dish", "dinner"],
            "dessert": ["dessert", "sweet"],
            "salad": ["salad"],
            "drink": ["beverage", "drink", "cocktail", "smoothie"]
          };
          
          const keywords = categoryKeywords[activeCategory] || [activeCategory];
          
          filteredRecipes = filteredRecipes.filter(recipe => {
            return recipe.categories.some(cat => 
              keywords.some(keyword => 
                cat.name.toLowerCase().includes(keyword.toLowerCase()) ||
                cat.slug.toLowerCase().includes(keyword.toLowerCase())
              )
            );
          });
          
          console.log(`🎯 Filtered recipes for ${activeCategory}:`, filteredRecipes.length);
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
        console.error(`Error fetching ${activeCategory} recipes:`, err);
        setError(`Failed to load ${activeCategory} recipes. Please try again.`);
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
        setRecentRecipes((response.data || []).slice(0, 8)); // Optional: limit to 8
      } catch (err) {
        console.error("Error fetching 'What others are cooking' recipes:", err);
      }
    };

    fetchWhatOthersAreCooking();
  }, []);

  // Recipes You Would Love ( AI PART Integration uses recommended wala endpoint not hybird wala aaile )
  // useEffect(() => {
  //   const fetchRecommendedRecipes = async () => {
  //     try {
  //       const response = await axios.get(
  //         "http://localhost:8000/api/recipes/recommended/"
  //       );
  //       setRecommendedRecipes(response.data.slice(0, 9)); // Limit to 9 for carousel (3x3)
  //     } catch (error) {
  //       console.error("Error fetching recommended recipes:", error);
  //     }
  //   };

  //   fetchRecommendedRecipes();
  // }, []);

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
          
          {/*Category Recipe Sections */}
          <div className="mt-[4vh] mb-[6vh]">
            <h2 className="text-2xl md:text-3xl font-bold mb-[2vh] text-center md:text-left">
              {activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1)}{" "}
              Recipes
            </h2>
            {renderRecipeCards(recipes, loading)}
          </div>

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