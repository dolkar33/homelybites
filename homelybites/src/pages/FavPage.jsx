import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RecipeCard from "../components/RecipeCard"; // Assuming this exists
import BackButton from "../components/BackButton";

const FavPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demo
  const mockFavorites = [
    {
      id: 1,
      title: "White Pasta",
      image: "/Images/HomePageImage/Image.png",
      alt: "White Pasta",
      description: "White pasta is a smooth, soft Italian dish.",
    },
  ];

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const response = await fetch("/api/favorites/", {
          headers: {
            "Content-Type": "application/json",
            // "Authorization": `Bearer ${token}`, // Uncomment if needed
          },
        });
        if (response.ok) {
          const data = await response.json();
          setFavorites(data.length ? data : mockFavorites);
        } else {
          setFavorites(mockFavorites);
        }
      } catch (error) {
        setFavorites(mockFavorites);
        console.error("Failed to fetch favorites:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex flex-col items-center w-full">
        <div className="w-[90%] md:w-[80%] lg:w-[70%] mx-auto mt-[2%]">
          <div className="flex items-center w-full mb-[2%]">
            <div className="w-[15%] min-w-[80px] flex">
              <BackButton />
            </div>
            <div className="flex-1 flex items-center">
              <div className="flex-1 border-t-2 border-gray-300"></div>
              <h2 className="mx-4 text-[3.6vw] font-bold text-center sm:text-[1.5vw] whitespace-nowrap">
                Your Favorite Recipe List
              </h2>
              <div className="flex-1 border-t-2 border-gray-300"></div>
            </div>
            <div className="w-[15%] min-w-[80px]"></div>
          </div>
          {loading ? (
            <div className="flex justify-center items-center h-[20vh]">
              <span className="text-lg text-gray-500">Loading...</span>
            </div>
          ) : favorites.length === 0 ? (
            <div className="flex justify-center items-center h-[20vh]">
              <span className="text-lg text-gray-400">No favorites yet!</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-[3%]">
              {favorites.map((recipe) => (
                <div key={recipe.id} className="w-[95%] mx-auto">
                  <RecipeCard recipe={recipe} isFavorite={true} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FavPage;