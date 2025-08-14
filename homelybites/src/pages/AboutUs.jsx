import React from "react";
import { User } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 py-8 sm:py-12 lg:py-16 xl:py-20">
        {/* Our Missions Section */}
        <section className="mb-12 sm:mb-16 lg:mb-20 xl:mb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-center">
            {/* Text Content - Now first in order */}
            <div className="space-y-6 sm:space-y-8">
              <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-5xl font-bold text-accent font-poppins leading-tight">
                Our Missions
              </h2>
              <p className="text-gray-700 font-poppins leading-relaxed text-[14px] md:text-[18px] lg:text-[19px] xl:text-[20px]   text-justify lg:text-left selection:bg-accent selection:text-white max-w-prose mx-auto lg:mx-0">
                HomelyBites is on a mission to make cooking easy, fun, and
                personalized for everyone. We help you turn everyday ingredients
                into delicious meals tailored to your health and dietary needs.
                By reducing food waste and simplifying meal planning, we make
                your kitchen more efficient and creative. Our platform also
                brings people together through a vibrant cooking community.
                Because good food should be shared, enjoyed, and never
                stressful!.
                {/* Our Mission is to provide a tailored recipes which is tasty,
                healthy and also make people taste home wherever and whenever
                they want. We not only aim to make people use home ingredients
                and reduce food waste.<br></br> */}
                <div className="text-accent font-sans font-extrabold block  sm:inline sm:mt-0 sm:ml-2">
                  "Where Healthy Meets Homely.".
                </div>
              </p>
            </div>

            {/* Image - Now second in order */}
            <div>
              <div className="relative bg-gray-200 rounded-xl lg:rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[3/2] lg:aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-1000 transform hover:scale-[1.02]">
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
                  <div className="absolute top-3 right-3 sm:top-4 sm:right-4 lg:top-6 lg:right-6 bg-white/95 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 sm:p-3 lg:p-4 shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
                    <div className="text-xs text-[14px] md:text-[18px] lg:text-[19px] xl:text-[20px] font-poppins text-gray-800 font-medium whitespace-nowrap ">
                      Our Websites Tutorial
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 xl:gap-16 items-start">
            {/* Image */}
            <div className="order-1">
              <div className="relative bg-gray-200 rounded-xl lg:rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[3/2] md:aspect-square lg:aspect-[4/3] shadow-lg hover:shadow-2xl transition-all duration-1000 transform hover:scale-[1.02] mt-[100px]">
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

            {/* Text Content - Modified to expand below image */}
            <div className="order-2 lg:order-2 space-y-6 sm:space-y-8">
              <h2 className="text-center text-2xl sm:text-3xl lg:text-4xl xl:text-5xl 2xl:text-5xl font-bold text-accent font-poppins leading-tight">
                Our Flavorful Community
              </h2>
              <p className="text-gray-700 font-poppins leading-relaxed text-[14px] md:text-[18px] lg:text-[19px] xl:text-[20px] text-justify selection:bg-accent selection:text-white max-w-prose mx-auto lg:mx-0">
                At HomelyBites, we don't just serve recipes we serve up
                connections, creativity, and a whole lot of kitchen fun! Our
                community is where food lovers of all kinds come together to
                chop, stir, sprinkle, and share.
                <div className="text-[14px] md:text-[18px] lg:text-[19px] xl:text-[20px] text-gray-700 font-poppins">
                  <br />
                  Think of it like your cozy virtual kitchen party where you
                  can:
                  <br />
                  &#8226; 📸 Snap and share your sizzling dishes and oven-fresh
                  bakes. <br />
                  &#8226; ✍️ Blog your kitchen adventures like burnt toast and
                  all.
                  <br />
                  &#8226; 🎥 Drop videos, swap tips, and cheer each other on.
                  <br />
                  &#8226; 💬 Follow foodie friends and peek into their delicious
                  feeds.
                  <br />
                  <br />
                </div>
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
