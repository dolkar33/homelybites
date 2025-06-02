import React from "react";
import { User } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 xl:py-20">
        
        {/* Our Missions Section */}
        <section className="mb-12 sm:mb-16 lg:mb-20 xl:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
            
            {/* Text Content */}
            <div className="order-2 lg:order-1 space-y-6 sm:space-y-8">
              <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-accent font-inter leading-tight">
                Our Missions
              </h2>
              <p className="text-gray-700 font-inter leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl text-justify selection:bg-accent selection:text-white max-w-prose mx-auto lg:mx-0">
                Our Mission is to provide a tailored recipes which is tasty, healthy and also make people taste home wherever and whenever they want. We not only aim to make people use home ingredients and reduce food waste. 
                <span className="text-accent font-sans font-extrabold block mt-4 sm:inline sm:mt-0 sm:ml-2">
                  "YApping is left to be filled here"
                </span>
              </p>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2">
              <div className="relative bg-gray-200 rounded-xl lg:rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="absolute inset-0">
                  {/* Kitchen scene */}
                  <div className="w-full h-full flex items-center">
                    <img
                      src="Images/aboutimg/cooking.png"
                      alt="Girl Cooking"
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                  
                  {/* Overlay element */}
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 bg-white/95 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg transform hover:scale-105 transition-all duration-300">
                    <div className="text-xs sm:text-sm lg:text-base text-gray-800 font-medium whitespace-nowrap">
                      Recipe Cooking Tutorial
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-300 mb-12 sm:mb-16 lg:mb-20 xl:mb-24"></div>

        {/* Community Section */}
        <section className="mb-12 sm:mb-16 lg:mb-20 xl:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-center">
            
            {/* Image */}
            <div className="order-1">
              <div className="relative bg-gray-200 rounded-xl lg:rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[3/2] md:aspect-square lg:aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.02]">
                <div className="absolute inset-0">
                  {/* Community kitchen scene */}
                  <div className="w-full h-full flex items-center justify-center">
                    <img 
                      src="Images/aboutimg/gcook.png" 
                      alt="Community Cooking"
                      className="w-full h-full object-cover object-center"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="order-2 space-y-6 sm:space-y-8">
              <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-bold text-accent font-inter leading-tight">
                Community
              </h2>
              <p className="text-gray-700 font-inter leading-relaxed text-sm sm:text-base lg:text-lg xl:text-xl text-justify selection:bg-accent selection:text-white max-w-prose mx-auto lg:mx-0">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book. It has
                survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged.
              </p>
            </div>
          </div>
        </section>

        {/* Final Divider */}
        <div className="border-t border-gray-300 mt-12 sm:mt-16 lg:mt-20 xl:mt-24"></div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;