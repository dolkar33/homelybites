import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard";

// Recent Recipes Data
const recentRecipes = [
  {
    image: "/Images/HomePageImage/Image-1.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-1"
  },
  {
    image: "/Images/HomePageImage/Image-2.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-2"
  },
  {
    image: "/Images/HomePageImage/Image-3.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-3"
  },
  {
    image: "/Images/HomePageImage/Image-4.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-4"
  },
  {
    image: "/Images/HomePageImage/Image-1.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-5"
  },
  {
    image: "/Images/HomePageImage/Image-2.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-6"
  },
  {
    image: "/Images/HomePageImage/Image-3.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-7"
  },
  {
    image: "/Images/HomePageImage/Image-4.png",
    title: "White Pasta",
    description: "White pasta is a smooth, soft Italian dish.",
    slug: "white-pasta-8"
  },
];

const RecentRecipes = () => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      {/* Hero Section with Salad Image */}
      <div className="max-w-5xl mx-auto w-full px-4 mt-6">
        <div className="rounded-3xl overflow-hidden w-full h-48 md:h-64 flex items-center justify-center bg-[#FDEBED] relative mb-8">
          <img
            src="/Images/HomePageImage/salad.jpg"
            alt="hero salad"
            className="object-cover w-full h-full"
            style={{ objectPosition: "center center" }}
          />
        </div>

        {/* Visit Your Recent Recipes Title */}
        <div className="flex items-center w-full my-8">
          <div className="flex-1 border-t border-gray-300"></div>
          <div className="mx-4 text-2xl md:text-3xl font-semibold text-center">
            Visit Your Recent <span className="text-accent">Recipes</span>
          </div>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Recent Recipes Grid */}
        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recentRecipes.map((recipe, index) => (
              <RecipeCard 
                key={index} 
                image={recipe.image}
                title={recipe.title}
                description={recipe.description}
                slug={recipe.slug}
              />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default RecentRecipes;