import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PersonIcon from "@mui/icons-material/Person";
import { Bookmark, Image, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";
import PostFeed from "../components/PostFeed";

const SavedPost = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      try {
        // Saved posts list
        const savedRes = await axiosInstance.get("/api/saved-posts/");
        const saved = savedRes.data?.results || savedRes.data || [];
        setPosts(Array.isArray(saved) ? saved : []);

        // Categories
        try {
          const catRes = await axiosInstance.get("/api/categories/");
          setCategories(catRes.data.results || []);
        } catch {}

        // Current user
        try {
          const userRes = await axiosInstance.get("/api/user-profiles/my_profile/");
          setCurrentUser({
            name: userRes.data.user.first_name + " " + userRes.data.user.last_name,
            profile_image: userRes.data.profile_image,
            posts: userRes.data.posts || 0,
            following: userRes.data.following || 0,
            followers: userRes.data.followers || 0,
          });
        } catch {}
      } catch (e) {
        setError("Failed to load saved posts");
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleLike = async (postId) => {
    try {
      await axiosInstance.post(`/api/posts/${postId}/like/`);
      setPosts((posts) =>
        posts.map((post) =>
          post.id === postId
            ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
            : post
        )
      );
    } catch {}
  };

  const handleSave = async (postId) => {
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/save/`);
      const saved = res?.data?.saved;
      if (saved === false) {
        // removed from saved -> drop from list
        setPosts((posts) => posts.filter((p) => p.id !== postId));
      } else if (saved === true) {
        // already in list; keep isSaved true
        setPosts((posts) => posts.map((p) => (p.id === postId ? { ...p, isSaved: true } : p)));
      } else {
        // toggle fallback
        setPosts((posts) => posts.filter((p) => p.id !== postId));
      }
    } catch {}
  };

  const handleCategoryChange = async (category) => {
    try {
      const res = await axiosInstance.get(`/api/saved-posts/?category=${encodeURIComponent(category)}`);
      const list = res.data?.results || res.data || [];
      setPosts(Array.isArray(list) ? list : []);
      setActiveCategory(category);
    } catch {}
  };

  const handleCreatePost = () => navigate("/post");

  const getUserAvatar = () => {
    return currentUser?.profile_image ? (
      <>
        <img
          src={currentUser.profile_image}
          alt={currentUser?.name || "User"}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.nextElementSibling;
            if (fallback) fallback.style.display = "flex";
          }}
        />
        <div style={{ display: "none" }} className="items-center justify-center w-full h-full">
          <PersonIcon style={{ fontSize: 32, color: "#9ca3af" }} />
        </div>
      </>
    ) : (
      <PersonIcon style={{ fontSize: 32, color: "#9ca3af" }} />
    );
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-xl text-red-500">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            {/* Left Sidebar */}
            <div className="col-span-3 space-y-4 sm:space-y-6">
              <div className="sticky top-6 space-y-4 sm:space-y-6">
                {/* Profile */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-md relative flex items-center justify-center bg-gray-100">
                      {getUserAvatar()}
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4">{currentUser?.name}</h3>
                    <div className="grid grid-cols-1 gap-2 text-center">
                      <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                        <div className="text-base sm:text-lg font-bold text-gray-800">{currentUser?.posts || 0}</div>
                        <div className="text-xs text-gray-600 leading-tight">Posts</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">Navigation</h3>
                  <nav className="space-y-3 sm:space-y-4">
                    <button type="button" onClick={() => navigate("/community")} className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left">
                      <span className="text-lg sm:text-xl">🏠</span>
                      <span className="text-sm sm:text-base font-medium">Main Feed</span>
                    </button>
                    <button type="button" onClick={() => navigate("/MyPost")} className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left">
                      <span className="text-lg sm:text-xl">⚡</span>
                      <span className="text-sm sm:text-base font-medium">My Post</span>
                    </button>
                    <button type="button" onClick={() => navigate("/saved-posts")} className="flex items-center gap-2 sm:gap-3 text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl bg-red-50 w-full text-left">
                      <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base font-medium">Saved Posts</span>
                    </button>
                  </nav>
                </div>

                {/* Categories (match CommunityPage) */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">Categories</h3>
                  <nav className="space-y-2 sm:space-y-3">
                    {(Array.isArray(categories) && categories.length > 0 ? categories : []).map((category, idx) => {
                      const catLabel = category.label || category.name || category;
                      const catValue = category.value || (category.name ? category.name.toLowerCase() : String(category).toLowerCase());
                      return (
                        <button
                          key={category.id || catValue || idx}
                          onClick={() => handleCategoryChange(catValue)}
                          className={`block w-full text-left p-2 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base font-medium ${
                            activeCategory === catValue
                              ? "text-red-500 bg-red-50"
                              : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                          }`}
                        >
                          • {catLabel}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* Mid Section: Saved Feed */}
            <div className="col-span-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Header */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <div className="flex items-center bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 shadow-md flex items-center justify-center bg-gray-100">
                      {getUserAvatar()}
                    </div>
                    <span className="text-sm sm:text-base text-gray-600 flex-1 font-medium">Your Saved Posts</span>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <button onClick={handleCreatePost} className="p-1.5 sm:p-2 rounded-full hover:bg-gray-200 transition-colors" title="Create Post">
                        <Image className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>

                <PostFeed posts={posts} onLike={handleLike} onSave={handleSave} onAuthorClick={() => {}} icons={{ Bookmark }} />
              </div>
            </div>

            {/* Right Sidebar */}
            <div className="col-span-3">
              <div className="sticky top-6 space-y-4 sm:space-y-6 h-screen overflow-y-auto pr-4 -mr-4" style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                <style jsx>{`div::-webkit-scrollbar{display:none}`}</style>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input type="text" placeholder="Search saved..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none text-sm sm:text-base bg-transparent" />
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

export default SavedPost;
