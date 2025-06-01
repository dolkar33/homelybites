import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LandingPage = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar />

    <main className="flex-1 flex flex-col md:flex-row items-center justify-between max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-6 sm:py-8 relative">
      {/* Left: Text */}
      <div className="max-w-xl pt-4 sm:pt-8 pb-8 sm:pb-16 z-20">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-2">
          Fun Meets Flavor
          <br />
          Become a Cooking Pro with
        </h1>
        <span className="text-accent block text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold mb-2 mt-2">
          HomelyBites!
        </span>
        <p className="mt-4 sm:mt-6 text-gray-700 text-sm sm:text-base md:text-lg">
          Discover delicious, personalized recipes based on what you have at
          home. Whether you're a beginner or a home chef, HomelyBites helps you
          cook with ease and confidence.
        </p>
        <Link
          to="/signup"
          className="mt-6 sm:mt-8 inline-block text-white font-medium px-6 sm:px-8 py-2 sm:py-3 rounded-lg text-base sm:text-lg shadow hover:brightness-110 transition bg-accent"
        >
          Get Started
        </Link>
      </div>

      {/* Right: Images & Decorative Elements */}
      <div className="relative flex-1 flex items-center justify-center w-full h-[600px] sm:h-[700px] md:h-[600px]">
        {/* Decorative Circles */}
        <div className="absolute w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-accent opacity-60 top-4 right-1/3 translate-x-8 sm:translate-x-16"></div>
        <div className="absolute w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-accent opacity-60 top-1/3 right-3/4"></div>
        <div className="absolute w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-accent opacity-60 bottom-1/3 right-3/4"></div>
        <div className="absolute w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-accent opacity-60 bottom-10 sm:bottom-14 right-1/3 translate-x-8 sm:translate-x-16"></div>

        {/* Food Images - Positioned like the reference */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Top right stir fry */}
          <img
            src="/Images/LandingPage/Image-1.png"
            alt="Food bowl with stir fry"
            className="absolute top-6 sm:top-10 right-4 sm:right-10 md:right-50 w-48 sm:w-56 md:w-72 object-contain z-10"
          />

          {/* Bottom left salad bowl */}
          <img
            src="/Images/LandingPage/Image-2.png"
            alt="Fresh salad with chicken"
            className="absolute left-0 md:left-24 top-1/4 w-40 sm:w-48 md:w-64 object-contain z-10"
          />

          {/* Bottom right avocado toast */}
          <img
            src="/Images/LandingPage/image-4.png"
            alt="Avocado toast with egg"
            className="absolute bottom-8 sm:bottom-12 right-1/5 w-40 sm:w-48 md:w-56 object-contain z-10 top-1/2"
          />
        </div>
      </div>
    </main>

    <Footer />
  </div>
);

export default LandingPage;
