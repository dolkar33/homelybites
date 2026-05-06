import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const LandingPage = () => (
  <div className="min-h-screen flex flex-col">
    <Navbar showLoginButtons={true} showUserProfile={false} />
    <main className="flex-1 flex flex-col md:flex-row items-center justify-between w-full pl-[100px] py-8 relative">
      {/* Left: Text */}
      <div className="max-w-2xl pt-4 sm:pt-8 pb-8 sm:pb-16 z-20">
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

      {/* Right: Single background image */}
      <div className="relative flex-1 w-full h-[600px] sm:h-[700px] md:h-[545px]">
        <img
          src="/Images/LandingPage/landing-image.jpg"
          alt="Landing background"
          className="absolute right-0 top-1/2 -translate-y-1/2 h-[115%] w-auto max-w-none object-contain opacity-25 pointer-events-none select-none"
        />
      </div>
    </main>

    <Footer />
  </div>
);

export default LandingPage;
