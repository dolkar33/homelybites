import React, { useState } from "react";
import {
  Heart,
  Bookmark,
  ArrowLeft,
  Search,
  Image,
  X,
  Upload,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

<Navbar />;
const CommunityPage = () => {
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
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("Recipes");

  // User profile data - easy to replace with API call
  const currentUser = {
    name: "Jennie Kim",
    avatar: "/Images/CommunityPage/jennie.jpg",
    posts: 42,
    following: 42,
    followers: 42,
  };

  const categories = ["Recipes", "Videos", "Blogs", "Questions"];

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
    // TODO: Add API call to backend
    // await likePost(postId);
  };

  const handleSave = (postId) => {
    setPosts(
      posts.map((post) =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post
      )
    );
    // TODO: Add API call to backend
    // await savePost(postId);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    // TODO: Add API call to search posts
    // const results = await searchPosts(term);
    // setPosts(results);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    // TODO: Add API call to filter by category
    // const filteredPosts = await getPostsByCategory(category);
    // setPosts(filteredPosts);
  };

  const handleCreatePost = () => {
    window.location.href = "/post";
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
      <Navbar />

      <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6 relative">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <div className="mb-4 sm:mb-6">
            <button className="flex items-center gap-2 text-red-500 hover:text-red-600 transition-colors">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-base sm:text-lg font-medium">Back</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4 sm:space-y-6">
              {/* Profile Section */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <div className="text-center mb-4 sm:mb-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-md">
                    <img
                      src={currentUser.avatar}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                    {currentUser.name}
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                    <div className="text-base sm:text-lg font-bold text-gray-800">
                      {currentUser.posts}
                    </div>
                    <div className="text-xs text-gray-600 leading-tight">
                      Posts
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                    <div className="text-base sm:text-lg font-bold text-gray-800">
                      {currentUser.following}
                    </div>
                    <div className="text-xs text-gray-600 leading-tight">
                      Following
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                    <div className="text-base sm:text-lg font-bold text-gray-800">
                      {currentUser.followers}
                    </div>
                    <div className="text-xs text-gray-600 leading-tight">
                      Followers
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">
                  Navigation
                </h3>
                <nav className="space-y-3 sm:space-y-4">
                  <a
                    href="#"
                    className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50"
                  >
                    <span className="text-lg sm:text-xl">🏠</span>
                    <span className="text-sm sm:text-base font-medium">
                      Home Page
                    </span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50"
                  >
                    <span className="text-lg sm:text-xl">⚡</span>
                    <span className="text-sm sm:text-base font-medium">
                      My Post
                    </span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50"
                  >
                    <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-sm sm:text-base font-medium">
                      Saved Recipes
                    </span>
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50"
                  >
                    <span className="text-lg sm:text-xl">📈</span>
                    <span className="text-sm sm:text-base font-medium">
                      Popular This week
                    </span>
                  </a>
                </nav>
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

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="space-y-4 sm:space-y-6">
                {/* Search Bar */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <div className="relative">
                    <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                    <input
                      type="text"
                      placeholder="Search......"
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-100 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Story Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <div className="flex items-center bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 shadow-md">
                      <img
                        src={currentUser.avatar}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-sm sm:text-base text-gray-600 flex-1 font-medium">
                      Let's Swap Stories, Recipes & Smiles
                    </span>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button
                        onClick={handleCreatePost}
                        className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 transition-colors"
                        title="Create Post"
                      >
                        <Image className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Posts Feed */}
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden"
                  >
                    {/* Post Header */}
                    <div className="p-4 sm:p-6 flex items-center">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 shadow-md">
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-gray-800">
                          {post.author.name}
                        </h4>
                        <p className="text-sm sm:text-base text-gray-600 font-medium">
                          {post.title}
                        </p>
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
          </div>
        </div>
      </div>

      <Footer />
      
    </div>
  );
};

export default CommunityPage;
