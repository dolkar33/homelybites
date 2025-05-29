import React from "react";
import { User } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        {/* Our Missions Section */}
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Text Content */}
            <div className="order-2 lg:order-1 mb-12">
              <h2 className="flex justify-center text-2xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-11 sm:mb-6 text-accent font-inter">
                Our Missions
              </h2>
              <p className="text-gray-700 font-inter leading-relaxed text-sm sm:text-base lg:text-lg text-justify selection:bg-accent selection:text-white">
                Our Mission is to provide a tailored recipes which is tasty, healthy and also make people taste home wherever and whenever they want. We not only aim to make people use home ingredients and reduce food waste. <span className="text-accent font-sans font-extrabold">"YApping is left to be filled here" </span>
              </p>
            </div>

            {/* Image */}
            <div className="order-1 lg:order-2">
              <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-[4/3] shadow-lg hover:shadow-xl transition-shadow duration-300 flex items-center">
                <div className="absolute inset-0 ">
                  {/* Kitchen scene placeholder */}
                  <div className=" w-full h-full flex items-center justify-center">
                    <img
                      src="Images/aboutimg/cooking.png"
                      alt="Girl Cooking"
                      className=" inset-0  w-full h-full object-cover object-center"
                    ></img>
                    </div>
                    {/* <div className="w-full h-full bg-cover bg-center flex items-center justify-center text-gray-500 text-sm sm:text-base lg:text-lg font-medium p-4 text-center">
                      Kitchen Cooking Scene
                    </div> */}
                  {/* Overlay elements */}
                  <div className="absolute top-2 right-2 sm:top-4 sm:right-4 bg-white rounded-lg p-2 sm:p-3 shadow-lg transform hover:scale-105 transition-transform">
                    <div className="text-xs sm:text-sm text-gray-800 font-medium">
                      Recipe Cooking Tutorial
                    </div>
                  </div>
                  {/* <div className="absolute top-1/2 left-1/4 w-6 h-6 sm:w-8 sm:h-8 bg-red-400 rounded-full opacity-80 animate-pulse"></div>
                  <div className="absolute top-1/3 right-1/3 w-4 h-4 sm:w-6 sm:h-6 bg-green-400 rounded-full opacity-80 animate-pulse delay-75"></div> */}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="border-t border-gray-300 mb-8 sm:mb-12 lg:mb-16 "></div>

        {/* Community Section */}
        <section className="mb-8 sm:mb-12 lg:mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* Image */}
            <div className="order-1">
              <div className="relative bg-gray-200 rounded-lg overflow-hidden aspect-[4/3] md:aspect-square shadow-lg hover:shadow-xl transition-shadow duration-300">
                {/*Inset means Margin jastai  */}
                <div className="absolute inset-0">
                  {/* Community kitchen scene placeholder */}
                  <div className="w-full h-full inset-0 flex items-center justify-center">
                    <img src="Images/aboutimg/gcook.png" className="w-full h-full inset-0 flex object-cover object-center "></img>
                    {/* <div className="w-full h-full bg-cover bg-center flex items-center justify-center text-gray-500 text-sm sm:text-base lg:text-lg font-medium p-4 text-center">
                      Community Kitchen Scene
                    </div> */}
                  </div>
                  {/* Overlay elements */}
                  {/* <div className="absolute top-1/4 left-1/4 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-400 rounded-full opacity-80 animate-bounce"></div>
                  <div className="absolute top-1/2 right-1/4 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-teal-400 rounded-full opacity-80 animate-bounce delay-150"></div>
                  <div className="absolute bottom-1/3 left-1/2 w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-indigo-400 rounded-full opacity-80 animate-bounce delay-300"></div> */}
                </div>
              </div>
            </div>

            {/* Text Content */}
            <div className="order-2 mb-12">
              <h2 className="flex justify-center text-2xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold mb-11 sm:mb-6 text-accent font-inter">
                Community
              </h2>
              <p className="text-gray-700 font-inter leading-relaxed text-sm sm:text-base lg:text-lg text-justify selection:bg-accent selection:text-white">
                Lorem Ipsum is simply dummy text of the printing and typesetting
                industry. Lorem Ipsum has been the industry's standard dummy <br/>
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
