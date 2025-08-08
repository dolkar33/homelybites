import React, { useEffect, useState } from "react";
import axiosInstance from "../config/axiosInstance";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  "Recipe",
  "Cooking Tip",
  "Restaurant Review",
  "General Discussion",
  "Question",
];

function shuffleArray(array) {
  // Fisher-Yates shuffle
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const MyPost = () => {
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState(CATEGORIES);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch user profile and categories (from backend if available)
    const fetchUserAndCategories = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch current user profile
        const userRes = await axiosInstance.get("/api/user-profiles/my_profile/");
        setCurrentUser({
          id: userRes.data.user.id,
          name: userRes.data.user.first_name + " " + userRes.data.user.last_name,
          avatar: userRes.data.avatar || "/Images/CommunityPage/jennie.jpg",
          posts: userRes.data.posts || 0,
          following: userRes.data.following || 0,
          followers: userRes.data.followers || 0,
        });
        // Fetch categories from backend if endpoint exists
        try {
          const catRes = await axiosInstance.get("/api/categories/");
          if (catRes.data && catRes.data.results && catRes.data.results.length > 0) {
            setCategories(catRes.data.results);
          }
        } catch {}
      } catch (err) {
        setError("Failed to load user profile");
      }
      setLoading(false);
    };
    fetchUserAndCategories();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchPosts(activeCategory);
    }
    // eslint-disable-next-line
  }, [currentUser, activeCategory]);

  const fetchPosts = async (category = "") => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/posts/";
      if (category) {
        url += `?category=${encodeURIComponent(category)}`;
      }
      const res = await axiosInstance.get(url);
      let postsData = res.data.results || res.data || [];
      // Filter to only posts by the logged-in user
      if (currentUser && currentUser.id) {
        postsData = postsData.filter((post) => post.author && post.author.id === currentUser.id);
      }
      // Shuffle for random order if no category selected
      if (!category) postsData = shuffleArray(postsData);
      setPosts(postsData);
    } catch (err) {
      setError("Failed to load posts");
    }
    setLoading(false);
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
  };

  return (
    <>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Navbar />
        <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-12 gap-4 sm:gap-6">
              {/* Left Sidebar - Fixed */}
              <div className="col-span-3 space-y-4 sm:space-y-6">
                <div className="sticky top-6 space-y-4 sm:space-y-6">
                  {/* Profile Section */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <div className="text-center mb-4 sm:mb-6">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-md">
                        <img
                          src={currentUser?.avatar || "/Images/CommunityPage/jennie.jpg"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">
                        {currentUser?.name || "My Profile"}
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                        <div className="text-base sm:text-lg font-bold text-gray-800">
                          {currentUser?.posts || 0}
                        </div>
                        <div className="text-xs text-gray-600 leading-tight">Posts</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                        <div className="text-base sm:text-lg font-bold text-gray-800">
                          {currentUser?.following || 0}
                        </div>
                        <div className="text-xs text-gray-600 leading-tight">Following</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                        <div className="text-base sm:text-lg font-bold text-gray-800">
                          {currentUser?.followers || 0}
                        </div>
                        <div className="text-xs text-gray-600 leading-tight">Followers</div>
                      </div>
                    </div>
                  </div>
                  {/* Navigation */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">Navigation</h3>
                    <nav className="space-y-3 sm:space-y-4">
                      <button type="button" onClick={() => navigate('/')} className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left">
                        <span className="text-lg sm:text-xl">🏠</span>
                        <span className="text-sm sm:text-base font-medium">Home Page</span>
                      </button>
                      <button type="button" onClick={() => navigate('/MyPost')} className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left">
                        <span className="text-lg sm:text-xl">⚡</span>
                        <span className="text-sm sm:text-base font-medium">My Post</span>
                      </button>
                      <button type="button" onClick={() => navigate('/FavPage')} className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left">
                        <span className="text-lg sm:text-xl">🔖</span>
                        <span className="text-sm sm:text-base font-medium">Saved Recipes</span>
                      </button>
                    </nav>
                  </div>
                  {/* Categories */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">Categories</h3>
                    <nav className="space-y-2 sm:space-y-3">
                      {Array.isArray(categories) && categories.length > 0 ? (
                        categories.map((category, idx) => (
                          <button
                            key={category.id || category.name || category || idx}
                            onClick={() => handleCategoryChange(category.name || category)}
                            className={`block w-full text-left p-2 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base font-medium ${
                              (activeCategory === (category.name || category))
                                ? "text-red-500 bg-red-50"
                                : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                            }`}
                          >
                            • {category.name || category}
                          </button>
                        ))
                      ) : (
                        <div className="text-gray-400 text-sm">No categories found.</div>
                      )}
                    </nav>
                  </div>
                </div>
              </div>
              {/* Main Content */}
              <div className="col-span-9">
                <div className="space-y-4 sm:space-y-6">
                  <h2 className="text-2xl font-bold mb-4">My Posts</h2>
                  {loading ? (
                    <div className="text-center py-12 text-lg text-gray-500">Loading posts...</div>
                  ) : error ? (
                    <div className="text-center py-12 text-red-500">{error}</div>
                  ) : posts.length === 0 ? (
                    <div className="text-center py-12 text-gray-400">No posts found.</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {posts.map((post) => (
                        <div key={post.id} className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2">
                          <div className="flex items-center gap-3 mb-2">
                            <img src={post.author?.avatar || "/Images/CommunityPage/jennie.jpg"} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{post.author?.name || post.author_name || "Unknown"}</div>
                              <div className="text-xs text-gray-500">{post.category || "-"}</div>
                            </div>
                          </div>
                          <div className="font-bold text-lg mb-1">{post.title}</div>
                          <div className="text-gray-700 text-sm mb-2">{post.content}</div>
                          {post.images && post.images.length > 0 && (
                            <div className="flex gap-2 flex-wrap mb-2">
                              {post.images.map((media, idx) => {
                                const url = media.url || media;
                                const type = media.type || (typeof media === 'string' ? '' : '');
                                // Guess type from url extension if not present
                                const isVideo = type ? type.startsWith('video') : /\.mp4$|\.webm$|\.ogg$/i.test(url);
                                const isImage = type ? type.startsWith('image') : /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$|\.webp$/i.test(url);
                                if (isVideo) {
                                  return (
                                    <video key={idx} src={url} controls className="w-32 h-20 rounded-lg border bg-black" />
                                  );
                                } else if (isImage) {
                                  return (
                                    <img key={idx} src={url} alt="post-img" className="w-20 h-20 object-cover rounded-lg border" />
                                  );
                                } else {
                                  return null;
                                }
                              })}
                            </div>
                          )}
                          <div className="flex gap-4 text-xs text-gray-500 mt-auto">
                            <span>{post.likes || 0} likes</span>
                            <span>{post.comments_count || 0} comments</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default MyPost;
