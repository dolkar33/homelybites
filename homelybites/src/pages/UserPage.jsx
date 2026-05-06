import React, { useEffect, useMemo, useRef, useState } from "react";
import PersonIcon from "@mui/icons-material/Person";
import { Heart, Bookmark } from "lucide-react";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import PostFeed from "../components/PostFeed";
import { useNavigate, useLocation } from "react-router-dom";
import axiosInstance from "../config/axiosInstance";

const UserPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const rawUsername = params.get("username");
  const username = useMemo(() => (rawUsername ? rawUsername.replace(/^@/, "") : ""), [rawUsername]);
  const userId = params.get("userId");

  // No need for local author image helper; PostFeed handles it

  const [posts, setPosts] = useState([]);

  // Use the same categories as CommunityPage
  const CATEGORY_CHOICES = useMemo(() => ([
    { label: "Recipe", value: "recipe" },
    { label: "Cooking Tip", value: "tip" },
    { label: "Restaurant Review", value: "review" },
    { label: "General Discussion", value: "general" },
    { label: "Question", value: "question" },
  ]), []);
  const [activeCategory, setActiveCategory] = useState("");

  const [currentUser, setCurrentUser] = useState(null);

  const categories = CATEGORY_CHOICES.map(c => c.label);

  // Removed unused mock data

  // Backend already provides likes/isLiked/isSaved in correct shape (PostSerializer)

  const handleLike = async (postId) => {
    // Optimistic
    setPosts((prev) => prev.map((post) => {
      if (post.id !== postId) return post;
      const wasLiked = !!post.isLiked;
      const newLikes = Math.max(0, (typeof post.likes === 'number' ? post.likes : 0) + (wasLiked ? -1 : 1));
      return { ...post, isLiked: !wasLiked, likes: newLikes };
    }));
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/like/`);
      const serverLiked = res?.data?.liked ?? res?.data?.is_liked;
      const serverLikes = res?.data?.likes ?? res?.data?.like_count ?? res?.data?.likes_count;
      if (serverLiked !== undefined || serverLikes !== undefined) {
        setPosts((prev) => prev.map((post) => post.id === postId ? {
          ...post,
          isLiked: serverLiked !== undefined ? serverLiked : post.isLiked,
          likes: typeof serverLikes === 'number' ? serverLikes : post.likes,
        } : post));
      }
    } catch (e) {
      // Revert on failure
      setPosts((prev) => prev.map((post) => {
        if (post.id !== postId) return post;
        const wasLiked = !post.isLiked;
        const newLikes = Math.max(0, (typeof post.likes === 'number' ? post.likes : 0) + (wasLiked ? -1 : 1));
        return { ...post, isLiked: !post.isLiked, likes: newLikes };
      }));
    }
  };

  const handleSave = async (postId) => {
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/save/`);
      const nextSaved = typeof res?.data?.saved === 'boolean' ? res.data.saved : undefined;
      setPosts((prev) => prev.map((post) => post.id === postId ? {
        ...post,
        isSaved: nextSaved !== undefined ? nextSaved : !post.isSaved,
      } : post));
    } catch (e) {
      // noop UI, could show toast
    }
  };

  // removed unused searchTerm and handleSearch

  const handleCategoryChange = (categoryLabel) => {
    const next = activeCategory === categoryLabel ? "" : categoryLabel;
    setActiveCategory(next);
  };

  // removed unused handleCreatePost

  // Enhanced user profile navigation - keep as-is for internal profile clicks
  const handleUserProfileClick = (user) => {
    navigate(`/UserPage?userId=${user.id}&username=${user.username}`);
  };

  // Handle clicking on post author profile
  const handlePostAuthorClick = (author) => {
    handleUserProfileClick({ id: author?.id, username: author?.username });
  };

  // Fetch user profile and posts
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);
  useEffect(() => {
    const run = async () => {
      if (!userId && !username) {
        setLoading(false);
        return;
      }
      if (!hasLoaded.current) setLoading(true);
      try {
        // Profile (prefer by ID)
        let userRes;
        if (userId) {
          userRes = await axiosInstance.get(`/api/community-users/by-id/${encodeURIComponent(userId)}/`);
        } else {
          userRes = await axiosInstance.get(`/api/community-users/${encodeURIComponent(username)}/`);
        }
        const user = userRes.data;
        setCurrentUser({
          name: user.name || user.username,
          avatar: user.avatar || "",
          posts: user.posts || 0,
        });
        // Posts
        const choice = CATEGORY_CHOICES.find(c => c.label === activeCategory);
        const params = [];
        if (userId) {
          params.push(`author_id=${encodeURIComponent(userId)}`);
        } else if (username) {
          params.push(`author=${encodeURIComponent(username)}`);
        }
        if (choice?.value) params.push(`category=${encodeURIComponent(choice.value)}`);
        const qs = params.length ? `?${params.join('&')}` : "";
        const postsRes = await axiosInstance.get(`/api/posts/${qs}`);
        const data = Array.isArray(postsRes.data?.results) ? postsRes.data.results : (Array.isArray(postsRes.data) ? postsRes.data : []);
        setPosts(Array.isArray(data) ? data : []);
      } catch (e) {
        setPosts([]);
      } finally {
        setLoading(false);
        hasLoaded.current = true;
      }
    };
    run();
  }, [userId, username, activeCategory]);

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
                  <div className="text-center mt-2 text-base sm:text-lg font-normal text-gray-800">Posts: {currentUser?.posts ?? 0}</div>
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
                <PostFeed
                  posts={posts}
                  onLike={handleLike}
                  onSave={handleSave}
                  onAuthorClick={handlePostAuthorClick}
                  showDelete={false}
                  icons={{ Heart, Bookmark }}
                />
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