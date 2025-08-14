import React, { useState, useEffect, useMemo } from "react";
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
  breakfast: "Breakfast",
  soup: "Soup",
  lunch: "Main Course",
  dessert: "Dessert",
  salad: "Salad",
  drink: "Beverage",
};

const MainPage = () => {
  // Number of recipes to display in the "You Would Love" carousel
  const RECOMMENDATIONS_COUNT = 60; // larger pool; keep multiple of 3 for full rows
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [recommendedRecipes, setRecommendedRecipes] = useState([]);
  const [lovePool, setLovePool] = useState([]); // mixed-category pool for "You Would Love"

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
        const mappedCategory =
          categoryMapping[activeCategory] || activeCategory;
        const { items, count, next } = await recipeAPI.getRecipeByCategory(
          mappedCategory,
          page
        );

        console.log(
          `📋 Recipes received for ${activeCategory} (mapped to ${mappedCategory}):`,
          items
        );
        console.log(`🔢 Number of recipes:`, items?.length || 0, `(total: ${count})`);

        let filteredRecipes = items || [];

        // Client-side filtering as backup if backend doesn't filter properly
        const categoryKeywords = {
          breakfast: ["breakfast", "morning", "brunch"],
          soup: ["soup"],
          lunch: ["main course", "lunch", "main dish", "dinner"],
          dessert: ["dessert", "sweet"],
          salad: ["salad"],
          drink: ["beverage", "drink", "cocktail", "smoothie"],
        };

        const keywords = categoryKeywords[activeCategory] || [activeCategory];

        const inCategory = (recipe) =>
          Array.isArray(recipe?.categories) &&
          recipe.categories.some((cat) =>
            keywords.some(
              (keyword) =>
                (cat?.name || "").toLowerCase().includes(keyword.toLowerCase()) ||
                (cat?.slug || "").toLowerCase().includes(keyword.toLowerCase())
            )
          );

        if ((filteredRecipes?.length || 0) > 0) {
          filteredRecipes = filteredRecipes.filter(inCategory);
        }

        // Also compute excluded list using same rule
        const excludedByKeywords = (items || []).filter((r) => !inCategory(r));
        console.log(`🎯 Filtered count=${filteredRecipes.length}, Excluded count=${excludedByKeywords.length}`);

        // Compute excluded recipes (items not included in filtered list)
        // Prefer the version derived directly from the keyword rule above
        const excludedRecipesGlobal = excludedByKeywords;

        if (filteredRecipes && filteredRecipes.length > 0) {
          if (page === 1) {
            // First page - replace recipes
            setRecipes(filteredRecipes);
          } else {
            // Subsequent pages - append recipes
            setRecipes((prevRecipes) => [...prevRecipes, ...filteredRecipes]);
          }

          // Use backend pagination hint
          setHasMore(Boolean(next));
          
          // Do not alter mixed recommendations here; handled by a separate effect
        } else {
          if (page === 1) {
            setRecipes([]);
          }
          setHasMore(false);

          // Do not alter mixed recommendations here; handled by a separate effect
        }

        // Do not alter mixed recommendations here; handled by a separate effect
      } catch (err) {
        console.error(`Error fetching ${activeCategory} recipes:`, err);
        const errorMessage = `Failed to load ${activeCategory} recipes. Please try again.`;
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

  // Fetch a mixed-category pool for "Recipes You Would Love" on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        let pool = [];
        try {
          const { items } = await recipeAPI.getWhatOthersAreCooking();
          pool = Array.isArray(items) ? items : [];
        } catch (e) {
          console.warn('Primary mixed recommendations failed, will fallback', e);
        }

        if (!pool.length) {
          // Fallback: fetch general recipes list and normalize (service returns { items, count, next })
          try {
            const { items: allItems } = await recipeAPI.getRecipes({ page: 1, page_size: Math.max(RECOMMENDATIONS_COUNT * 2, 50) });
            pool = Array.isArray(allItems) ? allItems : [];
          } catch (e2) {
            console.warn('Fallback general recipes fetch failed', e2);
          }
        }

        if (!pool.length) {
          // Third-level fallback: pull a few categories and merge
          try {
            const cats = ["Breakfast", "Soup", "Main Course", "Dessert", "Salad", "Beverage"];
            const results = await Promise.allSettled(
              cats.map((c) => recipeAPI.getRecipeByCategory(c, 1))
            );
            const merged = [];
            const seen = new Set();
            for (const r of results) {
              if (r.status === 'fulfilled') {
                const items = r.value?.items || [];
                for (const it of items) {
                  const key = it?.id ?? it?.slug ?? it?.title;
                  if (!key || seen.has(key)) continue;
                  seen.add(key);
                  merged.push(it);
                }
              }
            }
            pool = merged;
          } catch (e3) {
            console.warn('Category merge fallback failed', e3);
          }
        }

        if (!mounted) return;
        // If pool is smaller than desired, supplement with general recipes to reach target size
        let supplemented = [...pool];
        if (supplemented.length < RECOMMENDATIONS_COUNT) {
          try {
            const seen = new Set(supplemented.map(r => r?.id ?? r?.slug ?? r?.title));
            let pageN = 1;
            let hasMoreGlobal = true;
            while (supplemented.length < RECOMMENDATIONS_COUNT && hasMoreGlobal) {
              const { items: extraItems, next: nextUrl } = await recipeAPI.getRecipes({ page: pageN, page_size: 50 });
              const extra = Array.isArray(extraItems) ? extraItems : [];
              for (const it of extra) {
                const key = it?.id ?? it?.slug ?? it?.title;
                if (!key || seen.has(key)) continue;
                supplemented.push(it);
                seen.add(key);
                if (supplemented.length >= RECOMMENDATIONS_COUNT) break;
              }
              pageN += 1;
              hasMoreGlobal = Boolean(nextUrl) && extra.length > 0;
              if (!hasMoreGlobal) break;
            }
          } catch (e4) {
            console.warn('Supplemental general recipes fetch failed', e4);
          }
        }

        console.log('❤️ Mixed pool size before sample:', pool.length, 'after supplement:', supplemented.length, 'target:', RECOMMENDATIONS_COUNT);
        setLovePool(supplemented);
        const stableList = uniqueByKey(supplemented).slice(0, RECOMMENDATIONS_COUNT);
        setRecommendedRecipes(stableList);
      } catch (e) {
        // Non-fatal: leave recommendations as-is
        console.warn('Failed to fetch mixed recommendations', e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // When category changes, re-sample from the mixed pool for variety
  useEffect(() => {
    if (lovePool.length > 0) {
      // Use combined sources to ensure enough unique items, but keep order stable
      const combined = uniqueByKey([...lovePool, ...recipes]).slice(0, RECOMMENDATIONS_COUNT);
      setRecommendedRecipes(combined);
    }
    // Do not add lovePool to deps to avoid reshuffling on pool fetch; only reshuffle on category change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  // Safety net: if mixed pool is empty, derive recommendations from loaded category recipes
  useEffect(() => {
    if ((!lovePool || lovePool.length === 0) && Array.isArray(recipes) && recipes.length > 0) {
      console.log('Fallback: deriving recommendations from current category recipes');
      setRecommendedRecipes(uniqueByKey(recipes).slice(0, RECOMMENDATIONS_COUNT));
    }
  }, [recipes, lovePool]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  const shuffleRecommendations = () => {
    // Keep a stable set; no randomization
    const base = (lovePool && lovePool.length > 0) ? [...lovePool, ...recipes] : recipes;
    setRecommendedRecipes(uniqueByKey(base).slice(0, RECOMMENDATIONS_COUNT));
  };

  // Fixed 9 recommendations: no auto reshuffle interval

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setPage(1);
    setHasMore(true);
  };

  // Helper: truncate long descriptions with ellipsis
  const truncateText = (text, max = 140) => {
    if (!text) return "";
    const str = String(text).trim();
    if (str.length <= max) return str;
    return str.slice(0, max).trimEnd() + "...";
  };

  // Helper: random sample up to n elements
  const getRandomSample = (arr, n) => {
    const a = Array.isArray(arr) ? [...arr] : [];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a.slice(0, n);
  };

  // Helper: unique by stable key
  const uniqueByKey = (arr) => {
    const seen = new Set();
    const out = [];
    for (const it of Array.isArray(arr) ? arr : []) {
      const key = it?.id ?? it?.slug ?? it?.title;
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
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
              description={truncateText(
                recipe.description ||
                  `${recipe.prep_time ? `Prep: ${recipe.prep_time}min` : ""}${
                    recipe.prep_time && recipe.cook_time ? " | " : ""
                  }${recipe.cook_time ? `Cook: ${recipe.cook_time}min` : ""}` ||
                  recipe.difficulty ||
                  "Delicious recipe",
                140
              )}
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
            <div className="flex items-center justify-between mb-[2vh]">
              <h2 className="text-2xl md:text-3xl font-bold text-center md:text-left">
                Recipes You Would Love
              </h2>
            </div>
            {/** Memoized list for carousel */}
            {(() => {
              const loveDisplay = (recommendedRecipes && recommendedRecipes.length > 0)
                ? recommendedRecipes
                : (lovePool && lovePool.length > 0)
                ? uniqueByKey(lovePool).slice(0, RECOMMENDATIONS_COUNT)
                : uniqueByKey(recipes).slice(0, RECOMMENDATIONS_COUNT);
              return loveDisplay && loveDisplay.length > 0 ? (
              <>
              {/* Local styles to prevent arrow buttons from overlapping cards */}
              <style>{`
                .hb-love-carousel .carousel-inner { padding: 0 36px; }
                .hb-love-carousel .carousel-control-prev,
                .hb-love-carousel .carousel-control-next {
                  width: 36px; /* keep hit area compact */
                }
                .hb-love-carousel .carousel-control-prev { left: -6px; }
                .hb-love-carousel .carousel-control-next { right: -6px; }
                @media (min-width: 768px) {
                  .hb-love-carousel .carousel-inner { padding: 0 48px; }
                  .hb-love-carousel .carousel-control-prev { left: -10px; }
                  .hb-love-carousel .carousel-control-next { right: -10px; }
                }
              `}</style>
              <Carousel
                className="hb-love-carousel"
                wrap={true}
                prevIcon={
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M11.354 1.646a.5.5 0 0 1 0 .708L6.707 7l4.647 4.646a.5.5 0 0 1-.708.708l-5-5a.5.5 0 0 1 0-.708l5-5a.5.5 0 0 1 .708 0z"/>
                    </svg>
                  </span>
                }
                nextIcon={
                  <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-accent text-white shadow">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M4.646 1.646a.5.5 0 0 1 .708 0l5 5a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708-.708L9.293 7 4.646 2.354a.5.5 0 0 1 0-.708z"/>
                    </svg>
                  </span>
                }
              >
                {loveDisplay
                  .reduce((result, recipe, index) => {
                    if (index % 3 === 0) result.push([]);
                    result[result.length - 1].push(recipe);
                    return result;
                  }, [])
                  .map((group, idx) => (
                    <Carousel.Item key={idx}>
                      <Row className="justify-content-center">
                        {group.map((recipe, recIdx) => (
                          <Col
                            md={4}
                            key={recipe?.id ?? recipe?.slug ?? recipe?.title ?? recIdx}
                            className="d-flex justify-content-center mb-4"
                          >
                            <RecipeCard
                              key={recipe?.id ?? recipe?.slug ?? recipe?.title ?? recIdx}
                              image={recipe.image_url || recipe.image || "/Images/default.jpg"}
                              title={recipe.title}
                              description={truncateText(
                                recipe.description ||
                                  recipe.instructions ||
                                  "No description available",
                                140
                              )}
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
              </>
              ) : (
              <div className="bg-gray-100 text-gray-600 text-center py-6 rounded-lg">
                Loading AI-based recommendations...
              </div>
              );
            })()}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
};

export default MainPage;