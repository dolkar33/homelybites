import React, { useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { useNavigate } from "react-router-dom"; // Add this import
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

// Recipe Card component for sidebar
const SidebarRecipeCard = ({ image, title, isActive = false }) => (
  <div className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
    isActive ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 hover:bg-gray-100'
  }`}>
    <div className="w-12 h-12 rounded-lg overflow-hidden mr-3 flex-shrink-0">
      <img 
        src={image || "/Images/HomePageImage/Image-1.png"} 
        alt={title}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.parentElement.innerHTML = '<div class="w-full h-full bg-orange-200 flex items-center justify-center"><span class="text-xs text-orange-600">IMG</span></div>';
        }}
      />
    </div>
    <div className="min-w-0">
      <h4 className="text-sm font-medium text-gray-900 truncate">{title}</h4>
    </div>
  </div>
);

const RecipePage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate(); // Add this hook

  const sidebarRecipes = [
    { title: "Hot Chowmein Recipe", image: "/Images/HomePageImage/Image-1.png", isActive: true },
    { title: "Veg-Momo Recipe", image: "/Images/HomePageImage/Image-2.png" },
    { title: "Paneer Curry Recipe", image: "/Images/HomePageImage/Image-3.png" },
    { title: "Paneer Tikka Recipe", image: "/Images/HomePageImage/Image-4.png" },
    { title: "Paneer Tikka Recipe", image: "/Images/HomePageImage/Image-1.png" },
    { title: "Veg-Chowmein Recipe", image: "/Images/HomePageImage/Image-2.png" },
    { title: "Veg-Momo Recipe", image: "/Images/HomePageImage/Image-3.png" },
    { title: "Paneer Curry Recipe", image: "/Images/HomePageImage/Image-4.png" },
    { title: "Veg-Chowmein Recipe", image: "/Images/HomePageImage/Image-1.png" }
  ];
  
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <div className="flex-1 flex relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
          w-64 bg-white border-r border-gray-200 p-4
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:block
        `}>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-4">
              <button 
                className="flex items-center gap-2 text-[#ff6b6b] mb-6 hover:opacity-80 transition-opacity"
                onClick={handleBack} // Add the onClick handler here
              >
                <span className="text-xl">←</span>
                <span className="text-lg font-medium">Back</span>
              </button>
              {/* Mobile close button */}
              <button 
                className="lg:hidden text-gray-600 hover:text-gray-900"
                onClick={() => setSidebarOpen(false)}
              >
                ×
              </button>
            </div>
            
            <h3 className="font-semibold text-gray-900 mb-3">Recommend Recipes</h3>
            
            <div className="space-y-2">
              {sidebarRecipes.map((recipe, index) => (
                <SidebarRecipeCard key={index} {...recipe} />
              ))}
            </div>
            
            <button className="text-orange-500 text-sm mt-4 hover:text-orange-600">
              Load more...
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-3 sm:p-4 lg:p-8">
          {/* Mobile Header with Menu Button */}
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <button
              className="p-2 text-gray-600 hover:text-gray-900"
              onClick={() => setSidebarOpen(true)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                <div className="w-full h-0.5 bg-current"></div>
                <div className="w-full h-0.5 bg-current"></div>
                <div className="w-full h-0.5 bg-current"></div>
              </div>
            </button>
            
            {/* Search Bar */}
            <div className="flex-1 max-w-xs ml-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <Search className="w-4 h-4 text-gray-400 absolute right-2 top-2" />
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Recipe Title */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6 text-center lg:text-left">
              Chicken Momo
            </h1>

            {/* Recipe Description */}
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 leading-relaxed px-2 sm:px-0">
              Chicken Momo is a popular South Asian dumpling, especially loved in Nepal, Tibet, and parts of India. It consists of a 
              spiced chicken filling wrapped in a thin dough and is usually steamed, though it can also be fried or pan-fried. It's a 
              flavorful and satisfying snack or meal, often served with a tangy tomato-based dipping sauce.
            </p>

            {/* Recipe Image */}
            <div className="w-full h-48 sm:h-64 lg:h-80 rounded-xl lg:rounded-2xl overflow-hidden mb-6 sm:mb-8 bg-gray-900 mx-2 sm:mx-0">
              <div className="w-full h-full flex items-center justify-center">
                <img src="/Images/momo.jpg" alt="Chicken Momo" className="w-full h-full object-cover" />
              </div>
            </div>

            {/* Recipe Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8 mb-6 sm:mb-8 px-2 sm:px-0">
              {/* Ingredients */}
              <div className="order-2 xl:order-1">
                <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-4">Ingredients</h2>
                
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">For the Dough:</h3>
                  <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>• 2 cups all-purpose flour</li>
                    <li>• ¾ cup water (adjust as needed)</li>
                    <li>• ½ tsp salt</li>
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 text-sm sm:text-base">For the Chicken Filling:</h3>
                  <ul className="space-y-2 text-gray-700 text-sm sm:text-base">
                    <li>• 250g ground chicken</li>
                    <li>• 1 medium onion (finely chopped)</li>
                    <li>• 2 tbsp spring onion (finely chopped)</li>
                    <li>• 1 tbsp garlic (minced)</li>
                    <li>• 1 tbsp ginger (minced)</li>
                    <li>• 1 tsp soy sauce</li>
                    <li>• ½ tsp ground cumin</li>
                    <li>• ½ tsp ground coriander</li>
                    <li>• Salt to taste</li>
                    <li>• 1 tbsp oil (optional, for juiciness)</li>
                  </ul>
                </div>

                {/* Nutritional Facts */}
                <div className="bg-red-50 p-3 sm:p-4 rounded-lg">
                  <h3 className="font-semibold text-red-400 mb-3 text-sm sm:text-base">Nutritional Facts</h3>
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div className="flex justify-between py-1">
                      <span>Calories</span>
                      <span>250 kcal</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Protein</span>
                      <span>15g</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Carbohydrates</span>
                      <span>25g</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Fat</span>
                      <span>10g</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Fiber</span>
                      <span>1g</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Sodium</span>
                      <span>300mg</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="order-1 xl:order-2">
                <h2 className="text-xl sm:text-2xl font-bold text-red-400 mb-4">Instructions</h2>
                
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Prepare the Dough:</h3>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      Mix flour and salt, then add water gradually to form a soft, non-sticky dough. Cover and let rest for 30 minutes.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Make the Filling:</h3>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      In a bowl, combine ground chicken, onion, spring onion, garlic, ginger, soy sauce, cumin, pepper, salt, and oil. Mix well and refrigerate until ready to use.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Shape the Momos:</h3>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      Roll the dough into small balls. Flatten and roll into thin circles (3 inches wide). Add 1 tbsp filling in the center. Fold and pleat the edges to seal.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Steam:</h3>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      Place momos in a steamer lined with parchment or cabbage leaves. Steam over boiling water for 10-12 minutes or until the dough turns glossy and translucent.
                    </p>
                  </div>

                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">Serve:</h3>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      Enjoy hot with momo achar (tomato-sesame dipping sauce)!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default RecipePage;