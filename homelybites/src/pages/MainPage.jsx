import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";
import CategoryButton from "../components/CategoryButton";

const categories = [
  "Breakfast",
  "Quick and Easy",
  "Lunches",
  "Desserts",
  "Healthy",
  "Drinks",
];

const recipes = [
  {
    image: "/Images/HomePageImage/Image-1.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
  },
  {
    image: "/Images/HomePageImage/Image-2.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
  },
  {
    image: "/Images/HomePageImage/Image-3.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
  },
  {
    image: "/Images/HomePageImage/Image-4.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
  },
];

const MainPage = () => {
  const [activeCategory, setActiveCategory] = useState(categories[0]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      {/* Hero Section */}
      <div className="max-w-5xl mx-auto w-full px-4 mt-6">
        <div className="rounded-3xl overflow-hidden w-full h-48 md:h-64 flex items-center justify-center bg-[#FDEBED] relative mb-8">
          <img
            src="/Images/HomePageImage/salad.jpg"
            alt="hero salad"
            className="object-cover w-full h-full"
            style={{ objectPosition: "center center" }}
          />
        </div>
        {/* Ready to Cook Title */}
        <div className="flex items-center w-full my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="mx-4 text-2xl md:text-3xl font-semibold text-center">
            Ready to <span className="text-accent">Cook?</span>
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>
        {/* Category Buttons */}
        <div className="flex flex-col items-center w-full mb-6">
          <div className="flex items-center w-full justify-center flex-wrap gap-y-2">
            {categories.map((cat) => (
              <CategoryButton
                key={cat}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </CategoryButton>
            ))}
          </div>
        </div>
        
        {/* Recipes You Would Love */}
        <div className="mt-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center md:text-left">
            Recipes You Would Love
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recipes.map((r, i) => (
              <RecipeCard key={i} {...r} />
            ))}
          </div>
        </div>
        {/* What others are cooking */}
        <div className="mt-12 mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-center md:text-left">
            What others are cooking
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recipes.map((r, i) => (
              <RecipeCard key={i} {...r} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default MainPage;