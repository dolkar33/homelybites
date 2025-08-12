import React, { useState, useEffect } from "react";
import PersonIcon from "@mui/icons-material/Person";
import axiosInstance from "../config/axiosInstance";
import {
  Heart,
  Bookmark,
  ArrowLeft,
  Search,
  Image,
} from "lucide-react";
import Footer from "../components/Footer";
import Toast from "../components/Toast";
import Navbar from "../components/Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import PostFeed from "../components/PostFeed";

const mockSuggestedUsers = [
  {
    id: 1,
    name: "Lisa Manoban",
    username: "@lisam",
    avatar: "/Images/CommunityPage/lisa.jpg",
    isFollowing: false,
  },
  {
    id: 2,
    name: "Kim Jisoo",
    username: "@jisoo",
    avatar: "/Images/CommunityPage/jisoo.jpg",
    isFollowing: false,
  },
  {
    id: 3,
    name: "Park Chaeyoung",
    username: "@roses",
    avatar: "/Images/CommunityPage/rose.jpg",
    isFollowing: false,
  },
  {
    id: 4,
    name: "Choi Soobin",
    username: "@soobin",
    avatar: "/Images/CommunityPage/soobin.jpg",
    isFollowing: false,
  },
];

const CommunityPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState(mockSuggestedUsers);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentView = (params.get("view") || "feed").toLowerCase(); 
  const urlCategory = params.get("category") || "";

  
  useEffect(() => {
    const allowed = new Set(["feed", "mypost", "saved"]);
    if (!allowed.has(currentView)) {
      navigate("/community?view=feed", { replace: true });
    }
  }, [currentView, navigate]);

  
  useEffect(() => {
    setActiveCategory(urlCategory);
  }, [urlCategory]);

  const handleFollow = (idx) => {
    setSuggestedUsers((prev) =>
      prev.map((user, i) =>
        i === idx ? { ...user, isFollowing: !user.isFollowing } : user
      )
    );
  };

  const isReady = !loading && !error && currentUser && categories.length > 0 && posts.length >= 0;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
       
        const paramsArr = [];
        if (activeCategory) paramsArr.push(`category=${encodeURIComponent(activeCategory)}`);
        const qs = paramsArr.length ? `?${paramsArr.join("&")}` : "";

        // Fetch mid content by view
        if (currentView === "saved") {
          const savedRes = await axiosInstance.get(`/api/saved-posts/${qs}`);
          setPosts(savedRes.data?.results || savedRes.data || []);
        } else if (currentView === "mypost") {
          // Use dedicated endpoint for current user's posts
          const mineRes = await axiosInstance.get(`/api/posts/my-posts/${qs}`);
          setPosts(mineRes.data?.results || mineRes.data || []);
        } else {
          const postsRes = await axiosInstance.get(`/api/posts/${qs}`);
          setPosts(postsRes.data?.results || postsRes.data || []);
        }

        
        try {
          const catRes = await axiosInstance.get("/api/categories/");
          setCategories(catRes.data.results || []);
        } catch {}

        try {
          const userRes = await axiosInstance.get("/api/user-profiles/my_profile/");
          setCurrentUser({
            name: userRes.data.user.first_name + " " + userRes.data.user.last_name,
            profile_image: userRes.data.profile_image,
            posts: userRes.data.posts || 0,
            following: userRes.data.following || 0,
            followers: userRes.data.followers || 0,
          });
        } catch (e) {
          setCurrentUser({
            name: "Guest User",
            profile_image: "",
            avatar: "/Images/CommunityPage/jennie.jpg",
            posts: 0,
            following: 0,
            followers: 0,
          });
        }
      } catch (err) {
        setError("Failed to load community data");
      }
      setLoading(false);
    };
    fetchData();
  }, [currentView, activeCategory]);

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
    } catch (e) {
      setError("Failed to like/unlike post");
    }
  };

  const handleSave = async (postId) => {
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/save/`);
      const nextSaved = typeof res?.data?.saved === "boolean" ? res.data.saved : undefined;
      setPosts((posts) =>
        posts.map((post) =>
          post.id === postId
            ? { ...post, isSaved: nextSaved !== undefined ? nextSaved : !post.isSaved }
            : post
        )
      );
    } catch (e) {
      setError("Failed to save/unsave post");
    }
  };

 

  const handleCategoryChange = (category) => {
    // Toggle behavior: clicking the same category clears the filter
    const nextCategory = activeCategory === category ? "" : category;
    setActiveCategory(nextCategory);
    const categoryQS = nextCategory ? `&category=${encodeURIComponent(nextCategory)}` : "";
    navigate(`/community?view=${currentView}${categoryQS}`);
  };

  const handleCreatePost = () => {
    window.location.href = "/post";
  };

  const handleUserProfileClick = (user) => {
    window.location.href = `/UserPage?userId=${user.id}&username=${user.username}`;
  };

  const handlePostAuthorClick = (author) => {
    const userProfile = {
      id: author.name.replace(/\s+/g, "").toLowerCase(),
      name: author.name,
      username: `@${author.name.replace(/\s+/g, "").toLowerCase()}`,
      avatar: author.avatar,
      posts: author.posts,
      following: author.following,
      followers: author.followers,
    };
    handleUserProfileClick(userProfile);
  };

  console.log("Render state:", { loading, error, currentUser, categoriesLength: categories.length, postsLength: posts.length });

  if (loading) return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;
  if (!currentUser) {
    console.log("No current user, showing fallback");
    return <div className="flex items-center justify-center h-screen text-xl text-gray-500">Loading user profile...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
      <Navbar />

      <Toast
        show={Boolean(error)}
        message={error}
        variant="error"
        onClose={() => setError("")}
        autoHideDuration={3000}
        position="top-right"
      />

      <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            {/* Left Sidebar - Fixed */}
            <div className="col-span-3 space-y-4 sm:space-y-6">
              <div className="sticky top-6 space-y-4 sm:space-y-6">
                {/* Profile Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl sm:rounded-2xl overflow-hidden mb-3 sm:mb-4 shadow-md relative flex items-center justify-center bg-gray-100">
                      {currentUser?.profile_image ? (
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
                    <button
                      type="button"
                      onClick={() => navigate(`/community?view=feed${activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ""}`)}
                      className={`flex items-center gap-2 sm:gap-3 transition-colors p-2 rounded-lg sm:rounded-xl w-full text-left ${
                        currentView === "feed" ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg sm:text-xl">🏠</span>
                      <span className="text-sm sm:text-base font-medium">
                        Main Feed
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/community?view=mypost${activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ""}`)}
                      className={`flex items-center gap-2 sm:gap-3 transition-colors p-2 rounded-lg sm:rounded-xl w-full text-left ${
                        currentView === "mypost" ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-lg sm:text-xl">⚡</span>
                      <span className="text-sm sm:text-base font-medium">
                        My Post
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/community?view=saved${activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ""}`)}
                      className={`flex items-center gap-2 sm:gap-3 transition-colors p-2 rounded-lg sm:rounded-xl w-full text-left ${
                        currentView === "saved" ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                      }`}
                    >
                      <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="text-sm sm:text-base font-medium">
                        Saved Posts
                      </span>
                    </button>
                  </nav>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">
                    Categories
                  </h3>
                  <nav className="space-y-2 sm:space-y-3">
                    {(Array.isArray(categories) && categories.length > 0 ? categories : [
                      "Recipe",
                      "Cooking Tip",
                      "Restaurant Review",
                      "General Discussion",
                      "Question"
                    ]).map((category, idx) => {
                      // Support both backend and static category objects/strings
                      const catName = category.name || category;
                      return (
                        <button
                          key={category.id || catName || idx}
                          onClick={() => handleCategoryChange(catName)}
                          className={`block w-full text-left p-2 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base font-medium ${
                            activeCategory === catName
                              ? "text-red-500 bg-red-50"
                              : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                          }`}
                        >
                          • {catName}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>
            </div>

            {/* Main Content - Natural height without fixed height constraint */}
            <div className="col-span-6">
              <div className="space-y-4 sm:space-y-6">
                {/* Header Section (varies by view) */}
                {currentView === "mypost" ? (
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">My Post</h2>
                  </div>
                ) : currentView === "saved" ? (
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Saved Posts</h2>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                    <div className="flex items-center bg-gray-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden mr-3 sm:mr-4 shadow-md flex items-center justify-center bg-gray-100">
                        {currentUser?.profile_image ? (
                          <>
                            <img
                              src={currentUser.profile_image}
                              alt="User"
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
                        )}
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
                )}

                {/* Posts Feed */}
                <PostFeed
                  posts={posts}
                  onLike={handleLike}
                  onSave={handleSave}
                  onAuthorClick={handlePostAuthorClick}
                  icons={{ Heart, Bookmark }}
                />
              </div>
            </div>

            {/* Right Sidebar - Fixed */}
            <div className="col-span-3">
              <div className="sticky top-6 space-y-4 sm:space-y-6 h-screen overflow-y-auto pr-4 -mr-4"
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
                
                {/* Search Bar */}
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search disabled"
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none text-sm sm:text-base bg-transparent opacity-60 cursor-not-allowed"
                    disabled
                  />
                </div>
                {/* SUGGESTED_PEOPLE_INSERTION_POINT */}
                {/* Suggested People */}
                <div className="bg-white rounded-xl shadow p-4 mt-4">
                  <h3 className="font-semibold text-gray-800 mb-3 text-lg">Suggested People</h3>
                  <div className="space-y-3">
                    {suggestedUsers.map((user, idx) => (
                      <div key={user.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border" />
                          <div>
                            <div className="font-medium text-gray-800 text-sm">{user.name}</div>
                            <div className="text-xs text-gray-500">{user.username}</div>
                          </div>
                        </div>
                        <button
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors duration-150 ${user.isFollowing ? 'bg-gray-200 text-gray-500' : 'bg-accent text-white hover:bg-accent/80'}`}
                          onClick={() => handleFollow(idx)}
                        >
                          {user.isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    ))}
                  </div>
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

// ExpandableDescription: shows one line, expands/collapses on click
function ExpandableDescription({ description }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!description) return null;
  const isLong = description.length > 60;
  return (
    <div className="text-gray-700 text-base whitespace-pre-line">
      {!expanded ? (
        <>
          <span className="truncate block overflow-hidden" style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
            {description}
          </span>
          {isLong && (
            <button className="text-xs text-red-500 ml-1 hover:underline" onClick={() => setExpanded(true)}>
              ...show more
            </button>
          )}
        </>
      ) : (
        <>
          <span>{description}</span>
          {isLong && (
            <button className="text-xs text-red-500 ml-2 hover:underline" onClick={() => setExpanded(false)}>
              show less
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default CommunityPage;