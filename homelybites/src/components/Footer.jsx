import React from "react";

const Footer = () => (
  <footer className="bg-accent text-white text-center w-full mt-auto min-h-[3vh] sm:min-h-[4vh] md:min-h-[5vh] flex items-center">
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 md:px-8 py-1 sm:py-1 md:py-2 lg:py-2 text-xs sm:text-sm md:text-base lg:text-lg">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 md:gap-4 lg:gap-6">
        <span className="font-medium">© 2025 HomelyBites</span>
        <span className="hidden sm:inline text-gray-200">|</span>
        <p className="hover:text-gray-200 transition-colors cursor-pointer">Privacy Policy</p>
        <span className="hidden sm:inline text-gray-200">|</span>
        <p className="hover:text-gray-200 transition-colors cursor-pointer">Terms & Conditions</p>
      </div>
    </div>
  </footer>
);

export default Footer;