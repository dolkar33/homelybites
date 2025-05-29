import React from "react";
import { Link } from "react-router-dom";

const RecipeCard = ({ image, title, description, slug }) => (
  <Link to={`/recipes/${slug}`} className="bg-white rounded-2xl shadow-md p-3 flex flex-col relative w-full max-w-[220px] mx-auto group">
    <img
      src={image}
      alt={title}
      className="rounded-xl w-full h-36 object-cover mb-3 group-hover:scale-105 transition-transform duration-200 ease-in-out"
    />
    <div className="font-bold text-base mb-1 text-gray-800 group-hover:text-accent transition-colors duration-200">{title}</div>
    <div className="text-xs text-gray-500 mb-8">{description}</div>
    {/* Optional: Keep or remove the button based on desired design */}
    {/* <div className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-accent flex items-center justify-center shadow group-hover:brightness-110 transition">
      <span className="text-white text-lg">&rarr;</span>
    </div> */}
  </Link>
);

export default RecipeCard;
