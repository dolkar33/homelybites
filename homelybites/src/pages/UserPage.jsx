import React, { useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import {
  Heart,
  Bookmark,
  ArrowLeft,
  Search,
  Image,
} from "lucide-react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

const UserPage = () => {
  const navigate = useNavigate();
  // Dietary plan: mutually exclusive selection
  const [dietaryPlan, setDietaryPlan] = useState(""); // "veg" | "nonveg" | ""
  const handleSelectDiet = (plan) => {
    // Radio-like exclusivity: selecting one deselects the other
    setDietaryPlan(plan);
  };

  // Mock data - easy to replace with API calls later
  const [posts, setPosts] = useState([
    {
      id: 1,
      author: {
        name: "Jennie Kim",
        avatar: "/Images/CommunityPage/jennie.jpg",
        posts: 42,
        following: 42,
        followers: 42,
      },
      title: "Best Places to grab a quick Snack",
      image: "/Images/CommunityPage/ramen.jpeg",
      likes: 24,
      isLiked: false,
      isSaved: false,
      description: "Let's Swap Stories, Recipes & Smiles",
    },
    {
      id: 2,
      author: {
        name: "Choi Soobin",
        avatar: "/Images/CommunityPage/soobin.jpg",
        posts: 42,
        following: 42,
        followers: 42,
      },
      title: "Best Places to grab a quick Snack",
      image: "/Images/CommunityPage/ramen.jpeg",
      likes: 18,
      isLiked: true,
      isSaved: true,
      description: "Perfect grilling session with friends!",
    },
    {
      id: 3,
      author: {
        name: "Jennie Kim",
        avatar: "/Images/CommunityPage/jennie.jpg",
        posts: 42,
        following: 42,
        followers: 42,
      },
      title: "Amazing Pasta Recipe",
      image: "/Images/CommunityPage/ramen.jpeg",
      likes: 35,
      isLiked: false,
      isSaved: false,
      description: "Delicious homemade pasta",
    },
    {
      id: 4,
      author: {
        name: "Choi Soobin",
        avatar: "/Images/CommunityPage/soobin.jpg",
        posts: 42,
        following: 42,
        followers: 42,
      },
      title: "Healthy Breakfast Ideas",
      image: "/Images/CommunityPage/ramen.jpeg",
      likes: 28,
      isLiked: true,
      isSaved: false,
      description: "Start your day right!",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Recipes");

  // User profile data - easy to replace with API call
  const currentUser = {
    name: "Soobin Choi",
    avatar: "/Images/CommunityPage/soobin.jpg",
    posts: 42,
    following: 42,
    followers: 42,
  };

  const categories = ["Recipes", "Videos", "Blogs", "Questions"];

  // Mock data for suggested people
  const suggestedPeople = [
    {
      id: 1,
      name: "Jennie",
      username: "@jenniekim",
      avatar: "/Images/CommunityPage/jennie.jpg",
    },
    {
      id: 2,
      name: "Jennie",
      username: "@jenniekim",
      avatar: "/Images/CommunityPage/jennie.jpg",
    },
    {
      id: 3,
      name: "Randy",
      username: "@randyortan",
      avatar: "/Images/CommunityPage/jennie.jpg",
    },
  ];

  // Mock trending hashtags
  const trendingHashtags = [
    "#keemananoodles",
    "#sadekomomo",
    "#foodlover",
    "#recipeshare",
    "#cooking",
    "#healthyfood"
  ];

  // Actions - ready for backend integration
  const handleLike = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const handleSave = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post
      )
    );
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  const handleCreatePost = () => {
    navigate('/post');
  };

  // Enhanced user profile navigation - you can pass user data or just the ID
  const handleUserProfileClick = (user) => {
    // Option 1: Navigate with user ID in URL params
    navigate(`/UserPage?userId=${user.id}&username=${user.username}`);
    // Option 2: Navigate to a route like /user/:id (requires route setup)
    // navigate(`/user/${user.id}`);
  };

  // Handle clicking on post author profile
  const handlePostAuthorClick = (author) => {
    // You can create a user object from the author data
    const userProfile = {
      id: author.name.replace(/\s+/g, '').toLowerCase(), // Generate ID from name
      name: author.name,
      username: `@${author.name.replace(/\s+/g, '').toLowerCase()}`,
      avatar: author.avatar,
      posts: author.posts,
      following: author.following,
      followers: author.followers
    };
    handleUserProfileClick(userProfile);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
      <Navbar />

      <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            {/* Left Sidebar - Fixed */}
            <div className="col-span-3 space-y-4 sm:space-y-6 hidden md:block">
              <div className="sticky top-0 space-y-4 sm:space-y-6">
                {/* Profile Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <div className="text-center mb-0 sm:mb-0">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-md relative flex items-center justify-center bg-gray-100">
                      {currentUser?.avatar || currentUser?.profile_image ? (
                        <>
                          <img
                            src={currentUser.avatar || currentUser.profile_image}
                            alt={currentUser?.name || "User"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = "flex";
                            }}
                          />
                          <div style={{ display: "none" }} className="items-center justify-center w-full h-full">
                            <PersonIcon style={{ fontSize: 40, color: "#9ca3af" }} />
                          </div>
                        </>
                      ) : (
                        <PersonIcon style={{ fontSize: 40, color: "#9ca3af" }} />
                      )}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                      {currentUser?.name}
                    </h3>
                  </div>
                  <div className="text-center mt-2 text-base sm:text-lg font-normal text-gray-800">Posts: {currentUser.posts}</div>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">
                    Categories
                  </h3>
                  <nav className="space-y-2 sm:space-y-3">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryChange(category)}
                        className={`block w-full text-left p-2 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base font-medium ${
                          activeCategory === category
                            ? "text-red-500 bg-red-50"
                            : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                        }`}
                      >
                        • {category}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content - Natural height without fixed height constraint */}
            <div className="col-span-12 md:col-span-6">
              <div className="space-y-4 sm:space-y-6">


                {/* Posts Feed */}
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    {/* Post Header - Made clickable */}
                    <div className="p-4 sm:p-6 flex items-center">
                      <div 
                        className="flex items-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                        onClick={() => handlePostAuthorClick(post.author)}
                      >
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 shadow-md">
                          <img
                            src={post.author.avatar}
                            alt={post.author.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-gray-800 hover:text-red-500 transition-colors">
                            {post.author.name}
                          </h4>
                          <p className="text-sm sm:text-base text-gray-600 font-medium">
                            {post.title}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Post Image */}
                    <div className="px-6 pb-6">
                      <div className="relative rounded-2xl overflow-hidden shadow-lg">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-80 object-cover"
                        />
                      </div>
                    </div>

                    {/* Post Actions */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center space-x-4 mb-4">
                        <button
                          onClick={() => handleLike(post.id)}
                          className={`flex items-center space-x-2 transition-all duration-200 ${
                            post.isLiked ? "text-red-500" : "text-gray-600"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                              post.isLiked
                                ? "bg-red-100"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            <Heart
                              className={`w-5 h-5 ${
                                post.isLiked ? "fill-current" : ""
                              }`}
                            />
                          </div>
                        </button>

                        <button
                          onClick={() => handleSave(post.id)}
                          className={`flex items-center space-x-2 transition-all duration-200 ${
                            post.isSaved ? "text-red-500" : "text-gray-600"
                          }`}
                        >
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                              post.isSaved
                                ? "bg-red-100"
                                : "bg-gray-100 hover:bg-gray-200"
                            }`}
                          >
                            <Bookmark
                              className={`w-5 h-5 ${
                                post.isSaved ? "fill-current" : ""
                              }`}
                            />
                          </div>
                        </button>
                      </div>

                      {post.likes > 0 && (
                        <p className="text-gray-600 font-medium">
                          {post.likes} {post.likes === 1 ? "like" : "likes"}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Sidebar - Fixed */}
            <div className="col-span-3 hidden md:block">
              <div className="sticky top-0 h-screen overflow-y-auto pr-4 -mr-4"
                style={{
                  scrollbarWidth: 'none', /* Firefox */
                  msOverflowStyle: 'none', /* IE and Edge */
                }}
              >
                <style jsx>{`
                  div::-webkit-scrollbar {
                    display: none; /* Safari and Chrome */
                  }
                `}</style>
                
                {/* Navigation */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 mt-0 mb-0">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">
                    Navigation
                  </h3>
                  <nav className="space-y-3 sm:space-y-4">
                    <button
                      type="button"
                      onClick={() => navigate('/community')}
                      className="flex items-center gap-2 sm:gap-3 transition-colors p-2 rounded-lg sm:rounded-xl w-full text-left text-gray-600 hover:text-red-500 hover:bg-gray-50"
                    >
                      <span className="text-lg sm:text-xl">🏠</span>
                      <span className="text-sm sm:text-base font-medium">
                        Home Page
                      </span>
                    </button>
                  </nav>
                </div>




              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default UserPage;