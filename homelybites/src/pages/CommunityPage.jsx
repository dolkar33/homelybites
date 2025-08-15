import React, { useState, useEffect, useRef } from "react";
import PersonIcon from "@mui/icons-material/Person";
import axiosInstance from "../config/axiosInstance";
import { Heart, Bookmark, Image, RefreshCw } from "lucide-react";

import Footer from "../components/Footer";
import Toast from "../components/Toast";
import Navbar from "../components/Navbar";
import { useNavigate, useLocation } from "react-router-dom";
import PostFeed from "../components/PostFeed";

const CommunityPage = () => {
  // Dynamic Suggested Users (by dietary match)
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [sugPage, setSugPage] = useState(1);
  const [sugHasNext, setSugHasNext] = useState(false);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState("");

  const fetchSuggestions = async (page = 1, append = false) => {
    setSugLoading(true);
    setSugError("");
    try {
      const res = await axiosInstance.get(`/api/suggestions/match/?page=${page}`);
      const results = Array.isArray(res.data?.results) ? res.data.results : [];
      const mapped = results.map((u) => ({
        id: u.id,
        name: u.name || u.username,
        username: u.username,
        avatar: u.avatar,
        posts: u.posts || 0,
      }));
      setSuggestedUsers((prev) => (append ? [...prev, ...mapped] : mapped));
      setSugHasNext(Boolean(res.data?.next));
      setSugPage(page);
    } catch (e) {
      setSugError("Failed to load suggestions");
    } finally {
      setSugLoading(false);
    }
  };

  const refreshSuggestions = () => {
    // If more pages, load next page and append; otherwise restart from page 1
    if (sugHasNext) {
      fetchSuggestions(sugPage + 1, true);
    } else {
      fetchSuggestions(1, false);
    }
  };

  // Ensure consistent fields across backend payloads
  // Backend categories map (labels shown in UI, values sent to API)
  const CATEGORY_CHOICES = [
    { label: "Recipe", value: "recipe" },
    { label: "Cooking Tip", value: "tip" },
    { label: "Restaurant Review", value: "review" },
    { label: "General Discussion", value: "general" },
    { label: "Question", value: "question" },
  ];
  const [showLeftSidebar, setShowLeftSidebar] = useState(false);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("");
  const guestUser = {
    name: "Guest User",
    profile_image: "",
    avatar: "/Images/CommunityPage/jennie.jpg",
    posts: 0,
  };
  const [currentUser, setCurrentUser] = useState(guestUser);
  const [categories, setCategories] = useState(CATEGORY_CHOICES);
  const [loading, setLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const hasLoaded = useRef(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState([]);
  // Smooth transition state for mid content (avoid flashing to 0 opacity)
  const [dimFade, setDimFade] = useState(false);
  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);

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

  // removed unused isReady

  useEffect(() => {
    const fetchData = async () => {
      if (hasLoaded.current) {
        setIsFetching(true);
      } else {
        setLoading(true);
      }
      setError("");
      try {
       
        const paramsArr = [];
        if (activeCategory) paramsArr.push(`category=${encodeURIComponent(activeCategory)}`);
        const qs = paramsArr.length ? `?${paramsArr.join("&")}` : "";

        // Fetch mid content by view
        if (currentView === "saved") {
          const savedRes = await axiosInstance.get(`/api/posts/saved/${qs}`);
          const data = savedRes.data?.results || savedRes.data || [];
          setPosts(Array.isArray(data) ? data : []);
        } else if (currentView === "mypost") {
          // Use dedicated endpoint for current user's posts
          const mineRes = await axiosInstance.get(`/api/posts/my-posts/${qs}`);
          const data = mineRes.data?.results || mineRes.data || [];
          setPosts(Array.isArray(data) ? data : []);
        } else {
          const postsRes = await axiosInstance.get(`/api/posts/${qs}`);
          const data = postsRes.data?.results || postsRes.data || [];
          setPosts(Array.isArray(data) ? data : []);
        }

        
        // Force categories to backend post categories (not recipe categories)
        setCategories(CATEGORY_CHOICES);

        try {
          const userRes = await axiosInstance.get("/api/user-profiles/my_profile/");
          const firstName = userRes?.data?.user?.first_name || "";
          const lastName = userRes?.data?.user?.last_name || "";
          const username = userRes?.data?.user?.username;
          const userId = userRes?.data?.user?.id;
          const baseUser = {
            name: `${firstName} ${lastName}`.trim() || username || "User",
            profile_image: userRes?.data?.profile_image || "",
            posts: 0,
          };

          // Fetch posts count from community users endpoint (serializer includes posts count)
          try {
            let communityUser;
            if (userId) {
              const cuRes = await axiosInstance.get(`/api/community-users/by-id/${encodeURIComponent(userId)}/`);
              communityUser = cuRes?.data;
            }
            const postsCount = typeof communityUser?.posts === 'number' ? communityUser.posts : (Array.isArray(communityUser?.posts) ? communityUser.posts.length : 0);
            setCurrentUser({
              ...baseUser,
              // Prefer avatar from community serializer if present
              profile_image: communityUser?.avatar || baseUser.profile_image,
              posts: postsCount,
            });
          } catch {
            // Fallback: set base without posts count
            setCurrentUser(baseUser);
          }
        } catch (e) {
          setCurrentUser(guestUser);
        }
        // Fetch initial suggestions independently of posts view
        fetchSuggestions(1, false);
      } catch (err) {
        setError("Failed to load community data");
        // Ensure we still have a usable user object so UI can render
        setCurrentUser(guestUser);
      }
      if (hasLoaded.current) {
        setIsFetching(false);
      } else {
        setLoading(false);
        hasLoaded.current = true;
      }
    };
    fetchData();
  }, [currentView, activeCategory]);

  // Trigger a subtle fade when view or category changes (0.95 -> 1)
  useEffect(() => {
    setDimFade(true);
    const t = setTimeout(() => setDimFade(false), 120);
    return () => clearTimeout(t);
  }, [currentView, activeCategory]);

  const handleLike = async (postId) => {
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const wasLiked = !!post.isLiked;
        const currentLikes = typeof post.likes === 'number' ? post.likes : 0;
        const newLikes = Math.max(0, currentLikes + (wasLiked ? -1 : 1));
        return { ...post, isLiked: !wasLiked, likes: newLikes };
      })
    );
    try {
      const res = await axiosInstance.post(`/api/posts/${postId}/like/`);
      // If backend returns authoritative fields, reconcile
      const serverLiked = res?.data?.liked ?? res?.data?.is_liked;
      const serverLikes = res?.data?.likes ?? res?.data?.like_count ?? res?.data?.likes_count;
      if (serverLiked !== undefined || serverLikes !== undefined) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? {
                  ...post,
                  isLiked: serverLiked !== undefined ? serverLiked : post.isLiked,
                  likes: typeof serverLikes === 'number' ? serverLikes : post.likes,
                }
              : post
          )
        );
      }
    } catch (e) {
      // Revert if request fails
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const wasLiked = !post.isLiked; // it was toggled
          const currentLikes = typeof post.likes === 'number' ? post.likes : 0;
          const newLikes = Math.max(0, currentLikes + (wasLiked ? -1 : 1));
          return { ...post, isLiked: !post.isLiked, likes: newLikes };
        })
      );
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

  // Open delete modal
  const handleDelete = (postId) => {
    setDeletingId(postId);
    setShowDeleteModal(true);
  };

  // Confirm deletion (optimistic)
  const confirmDelete = async () => {
    if (!deletingId) return;
    setDeletingLoading(true);
    const prevPosts = posts;
    setPosts((p) => p.filter((post) => post.id !== deletingId));
    try {
      await axiosInstance.delete(`/api/posts/${deletingId}/`);
      setShowDeleteModal(false);
      setDeletingId(null);
    } catch (e) {
      setPosts(prevPosts);
      setError("Failed to delete post");
      console.error(e);
    } finally {
      setDeletingLoading(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setDeletingId(null);
  };

  const handleCategoryChange = (categoryValue) => {
    // Toggle behavior: clicking the same category clears the filter
    const nextCategory = activeCategory === categoryValue ? "" : categoryValue;
    setActiveCategory(nextCategory);
    const categoryQS = nextCategory ? `&category=${encodeURIComponent(nextCategory)}` : "";
    navigate(`/community?view=${currentView}${categoryQS}`);
  };

  const handleCreatePost = () => {
    navigate('/post');
  };

  const handleUserProfileClick = (user) => {
    navigate(`/UserPage?userId=${user.id}&username=${user.username}`);
  };

  const handlePostAuthorClick = (author) => {
    // Navigate using actual backend identifiers
    handleUserProfileClick({ id: author?.id, username: author?.username });
  };

  // removed debug log

  if (loading) return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;

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

      {/* Hamburger buttons for mobile */}
      <div className="flex justify-between items-center md:hidden mb-4">
        <button
          onClick={() => setShowLeftSidebar(true)}
          className="p-2 rounded-lg bg-white shadow border border-gray-200"
          aria-label="Open Profile Sidebar"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <button
          onClick={() => setShowRightSidebar(true)}
          className="p-2 rounded-lg bg-white shadow border border-gray-200"
          aria-label="Open Navigation Sidebar"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </div>
      <div className="flex-1 px-4 sm:px-6 md:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-12 gap-4 sm:gap-6">
            {/* Left Sidebar Drawer (Mobile) */}
            {showLeftSidebar && (
              <div className="fixed inset-0 z-40 flex md:hidden">
                <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowLeftSidebar(false)}></div>
                <div className="relative bg-white w-72 max-w-full h-full shadow-xl z-50 animate-slideInLeft">
                  <button
                    className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={() => setShowLeftSidebar(false)}
                    aria-label="Close Sidebar"
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div className="p-4 overflow-y-auto h-full">
                    {/* Profile Section */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
                      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6 mb-6">
                        <div className="text-center mb-0 sm:mb-0">
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
                        <div className="grid grid-cols-1 gap-2 text-center">
                          <div className="bg-gray-50 rounded-xl sm:rounded-2xl p-2">
                            <div className="text-base sm:text-lg font-bold text-gray-800">
                              {currentUser.posts}
                            </div>
                            <div className="text-xs text-gray-600 leading-tight">Posts</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Categories */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">Categories</h3>
                        <nav className="space-y-2 sm:space-y-3">
                          {(Array.isArray(categories) && categories.length > 0 ? categories : CATEGORY_CHOICES).map((category, idx) => {
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
                    {/* Suggested People removed from mobile drawer; visible on desktop right sidebar only */}
                  </div>
                </div>
              </div>
            )}
            {/* Right Sidebar Drawer (Mobile) */}
            {showRightSidebar && (
              <div className="fixed inset-0 z-40 flex md:hidden justify-end">
                <div className="fixed inset-0 bg-black opacity-40" onClick={() => setShowRightSidebar(false)}></div>
                <div className="relative bg-white w-72 max-w-full h-full shadow-xl z-50 animate-slideInRight">
                  <button
                    className="absolute top-4 left-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200"
                    onClick={() => setShowRightSidebar(false)}
                    aria-label="Close Sidebar"
                  >
                    <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                  <div className="p-4 overflow-y-auto h-full">
                    {/* Navigation Section */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6 mt-0 mb-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-800 uppercase tracking-wide">Navigation</h3>
                        <nav className="space-y-3 sm:space-y-4">
                          <button
                            type="button"
                            onClick={() => navigate(`/community?view=feed${activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ""}`)}
                            className={`flex items-center gap-2 sm:gap-3 transition-colors p-2 rounded-lg sm:rounded-xl w-full text-left ${
                              currentView === "feed" ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-lg sm:text-xl">🏠</span>
                            <span className="text-sm sm:text-base font-medium">Main Feed</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/community?view=mypost${activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ""}`)}
                            className={`flex items-center gap-2 sm:gap-3 transition-colors p-2 rounded-lg sm:rounded-xl w-full text-left ${
                              currentView === "mypost" ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-lg sm:text-xl">📝</span>
                            <span className="text-sm sm:text-base font-medium">My Post</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/community?view=saved${activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ""}`)}
                            className={`flex items-center gap-2 sm:gap-3 transition-colors p-2 rounded-lg sm:rounded-xl w-full text-left ${
                              currentView === "saved" ? "text-red-500 bg-red-50" : "text-gray-600 hover:text-red-500 hover:bg-gray-50"
                            }`}
                          >
                            <span className="text-lg sm:text-xl">🔖</span>
                            <span className="text-sm sm:text-base font-medium">Saved Posts</span>
                          </button>
                        </nav>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Left Sidebar - Fixed */}
            <div className="col-span-3 space-y-4 sm:space-y-6 hidden md:block">
              <div className="sticky top-0 space-y-4 sm:space-y-6">
                {/* Profile Section */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <div className="text-center mb-0 sm:mb-0">
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
                    <div className="text-center mt-2 text-base sm:text-lg font-normal text-gray-800">Posts: {currentUser.posts}</div>
                  </div>
                </div>
                {/* Categories */}
                <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4 sm:mb-6 uppercase tracking-wide">
                    Categories
                  </h3>
                  <nav className="space-y-2 sm:space-y-3">
                    {(Array.isArray(categories) && categories.length > 0 ? categories : CATEGORY_CHOICES).map((category, idx) => {
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

            {/* Main Content - Natural height without fixed height constraint */}
            <div className="col-span-12 md:col-span-6">
              <div className={`space-y-4 sm:space-y-6 transition-opacity duration-200 ${dimFade || isFetching ? 'opacity-95' : 'opacity-100'}`}>
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
                  onDelete={handleDelete}
                  showDelete={currentView === "mypost"}
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

                {/* Suggested People */}
                <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-6 mt-4">
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800">Suggested People</h3>
                    <button
                      type="button"
                      onClick={refreshSuggestions}
                      className="inline-flex items-center gap-1 text-xs sm:text-sm text-gray-600 hover:text-red-500"
                      title={sugHasNext ? "Load more" : "Refresh"}
                    >
                      <RefreshCw className={`w-4 h-4 ${sugLoading ? 'animate-spin' : ''}`} />
                      {sugHasNext ? 'More' : 'Refresh'}
                    </button>
                  </div>
                  {sugError && (
                    <div className="text-xs text-red-500 mb-2">{sugError}</div>
                  )}
                  <div className="space-y-3">
                    {suggestedUsers.length === 0 && !sugLoading && (
                      <div className="text-sm text-gray-500">No suggestions yet.</div>
                    )}
                    {suggestedUsers.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 text-left hover:bg-gray-50 p-2 rounded-xl transition-colors cursor-pointer"
                        onClick={() => handleUserProfileClick(u)}
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                          ) : (
                            <PersonIcon style={{ fontSize: 24, color: '#9ca3af' }} />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="text-sm font-semibold text-gray-800 truncate">{u.name}</div>
                          <div className="text-xs text-gray-500 truncate">@{u.username}</div>
                        </div>
                      </div>
                    ))}
                    {sugLoading && (
                      <div className="text-xs text-gray-500">Loading suggestions...</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={deletingLoading ? undefined : cancelDelete} />
          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 w-11/12 max-w-md p-6 sm:p-7 z-10">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-5a1 1 0 102 0 1 1 0 00-2 0zm1-7a1 1 0 00-1 1v5a1 1 0 102 0V7a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800">Delete post?</h3>
                <p className="mt-1 text-sm text-gray-600">This action cannot be undone. The post will be permanently removed.</p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={cancelDelete}
                disabled={deletingLoading}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingLoading}
                className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              >
                {deletingLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default CommunityPage;