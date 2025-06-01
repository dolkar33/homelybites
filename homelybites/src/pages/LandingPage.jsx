import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LandingPage = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar showLoginButtons={true} showUserProfile={false} />
    <main className="flex-1 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto w-full px-8 py-8 relative">
      {/* Left: Text */}
      <div className="max-w-xl pt-8 pb-16 z-20">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight mb-2">
          Fun Meets Flavor
          <br />
          Become a Cooking Pro with
        </h1>
        <span className="text-accent block text-5xl md:text-6xl font-extrabold mb-2 mt-2">
          HomelyBites!
        </span>
        <p className="mt-6 text-gray-700 text-base md:text-lg">
          Discover delicious, personalized recipes based on what you have at home.
          Whether you're a beginner or a home chef, HomelyBites helps you cook
          with ease and confidence.
        </p>
        <Link to="/signup" className="mt-8 inline-block text-white font-medium px-8 py-3 rounded-lg text-lg shadow hover:brightness-110 transition bg-accent">
          Get Started
        </Link>
      </div>

      {/* Right: Images & Decorative Elements */}
      <div className="relative flex-1 flex items-center justify-center w-full h-[800px] md:h-[600px]">
        {/* Decorative Circles */}
        <div className="absolute w-14 h-14 rounded-full bg-accent opacity-60 top-4 right-1/3 translate-x-16"></div>
        <div className="absolute w-9 h-9 rounded-full bg-accent opacity-60 top-1/3 right-3/4"></div>
        <div className="absolute w-9 h-9 rounded-full bg-accent opacity-60 bottom-1/3 right-3/4"></div>
        <div className="absolute w-14 h-14 rounded-full bg-accent opacity-60 bottom-14 right-1/3 translate-x-16"></div>

        {/* Food Images - Positioned like the reference */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Top right stir fry */}
          <img
            src="/Images/LandingPage/Image-1.png"
            alt="Food bowl with stir fry"
            className="absolute top-10 right-10 md:right-50 w-72 object-contain z-10"
          />

          {/* Bottom left salad bowl */}
          <img
            src="/Images/LandingPage/Image-2.png"
            alt="Fresh salad with chicken"
            className="absolute left-0 md:left-24 top-1/4 w-64 object-contain z-10"
          />

          {/* Bottom right avocado toast */}
          <img
            src="/Images/LandingPage/image-4.png"
            alt="Avocado toast with egg"
            className="absolute bottom-12 right-1/5 w-56 object-contain z-10 top-1/2"
          />
        </div>
      </div>
    </main>

    <Footer />
  </div>
);

export default LandingPage;