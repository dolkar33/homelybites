import React from "react";
import { User } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Our Missions Section */}
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1 mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-accent font-inter text-center lg:text-left">
                Our Missions
              </h2>
              <p className="text-gray-700 font-inter leading-relaxed text-sm sm:text-base lg:text-lg text-justify selection:bg-accent selection:text-white">
                Our Mission is to provide a tailored recipes which is tasty,
                healthy and also make people taste home wherever and whenever
                they want. We not only aim to make people use home ingredients
                and reduce food waste.{" "}
                <span className="text-accent font-sans font-extrabold">
                  "YApping is left to be filled here"{" "}
                </span>
              </p>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2">
              <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-[4/3] shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center">
                <div className="absolute inset-0">
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src="Images/aboutimg/cooking.png"
                      alt="Girl Cooking"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                  {/* Overlay elements */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white rounded-lg p-2 sm:p-3 shadow-lg transform hover:scale-105 transition-transform">
                    <div className="text-xs sm:text-sm text-gray-800 font-medium">
                      Recipe Cooking Tutorial
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-300 my-8 sm:my-12 lg:my-16"></div>

        {/* Community Section */}
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Image */}
            <div className="order-1">
              <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-[4/3] md:aspect-square shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="absolute inset-0">
                  <div className="w-full h-full flex items-center justify-center">
                    <img
                      src="Images/aboutimg/gcook.png"
                      alt="Community Cooking"
                      className="w-full h-full object-cover object-center"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="order-2 mb-8 sm:mb-12">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-accent font-inter text-center lg:text-left">
                Community
              </h2>
              <p className="text-gray-700 font-inter leading-relaxed text-sm sm:text-base lg:text-lg text-justify selection:bg-accent selection:text-white">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy
                <br className="hidden sm:block" />
                text ever since the 1500s, when an unknown printer took a galley
                of type and scrambled it to make a type specimen book. It has
                survived not only five centuries, but also the leap into
                electronic typesetting, remaining essentially unchanged.
              </p>
            </div>
          </div>
        </section>

        {/* Final Divider */}
        <div className="border-t border-gray-300 mt-8 sm:mt-12 lg:mt-16"></div>
      </main>

      <Footer />
    </div>
  );
};

export default AboutUs;
