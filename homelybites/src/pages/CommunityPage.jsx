import React, { useState, useEffect } from "react";
import axiosInstance from "../config/axiosInstance";
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
  const [searchTerm, setSearchTerm] = useState("");
const [suggestedUsers, setSuggestedUsers] = useState(mockSuggestedUsers);

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
        const postsRes = await axiosInstance.get("/api/posts/");
        console.log('Posts response:', postsRes.data);
        setPosts(postsRes.data.results || []);
        
        const catRes = await axiosInstance.get("/api/categories/");
        console.log('Categories response:', catRes.data);
        setCategories(catRes.data.results || []);
        setActiveCategory(catRes.data.results?.[0] || "");

        try {
          const userRes = await axiosInstance.get("/api/user-profiles/my_profile/");
          console.log('User profile response:', userRes.data);
          setCurrentUser({
            name: userRes.data.user.first_name + " " + userRes.data.user.last_name,
            avatar: userRes.data.avatar || "/Images/CommunityPage/jennie.jpg",
            posts: userRes.data.posts || 0,
            following: userRes.data.following || 0,
            followers: userRes.data.followers || 0,
          });
        } catch (e) {
          console.log('User profile failed, setting guest user:', e);
          setCurrentUser({
            name: "Guest User",
            avatar: "/Images/CommunityPage/jennie.jpg",
            posts: 0,
            following: 0,
            followers: 0,
          });
        }
      } catch (err) {
        console.log('Data fetch error:', err);
        setError("Failed to load community data");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleLike = async (postId) => {
    try {
      await axiosInstance.post(`/api/posts/${postId}/like/`);
      setPosts(posts => posts.map(post =>
        post.id === postId
          ? { ...post, isLiked: !post.isLiked, likes: post.isLiked ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    } catch (e) {
      setError('Failed to like/unlike post');
    }
  };

  const handleSave = async (postId) => {
    try {
      await axiosInstance.post(`/api/posts/${postId}/save/`);
      setPosts(posts => posts.map(post =>
        post.id === postId ? { ...post, isSaved: !post.isSaved } : post
      ));
    } catch (e) {
      setError('Failed to save/unsave post');
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term) {
      try {
        const postsRes = await axiosInstance.get("/api/posts/");
        setPosts(postsRes.data);
      } catch (e) {
        setError('Failed to reload posts');
      }
      return;
    }
    try {
      const res = await axiosInstance.get(`/api/search/?q=${encodeURIComponent(term)}`);
      setPosts(res.data.posts || []);
    } catch (e) {
      setError('Search failed');
    }
  };

  const handleCategoryChange = async (category) => {
    setActiveCategory(category);
    try {
      const res = await axiosInstance.get(`/api/posts/?category=${encodeURIComponent(category)}`);
      setPosts(res.data);
    } catch (e) {
      setError('Failed to filter by category');
    }
  };

  const handleCreatePost = () => {
    window.location.href = "/post";
  };

  const handleUserProfileClick = (user) => {
    window.location.href = `/UserPage?userId=${user.id}&username=${user.username}`;
  };

  const handlePostAuthorClick = (author) => {
    const userProfile = {
      id: author.name.replace(/\s+/g, '').toLowerCase(), 
      name: author.name,
      username: `@${author.name.replace(/\s+/g, '').toLowerCase()}`,
      avatar: author.avatar,
      posts: author.posts,
      following: author.following,
      followers: author.followers
    };
    handleUserProfileClick(userProfile);
  };

  console.log('Render state:', { loading, error, currentUser, categoriesLength: categories.length, postsLength: posts.length });
  
  if (loading) return <div className="flex items-center justify-center h-screen text-xl">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-xl text-red-500">{error}</div>;
  if (!currentUser) {
    console.log('No current user, showing fallback');
    return <div className="flex items-center justify-center h-screen text-xl text-gray-500">Loading user profile...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navigation Bar */}
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
                    <button
                      type="button"
                      onClick={() => navigate('/')}
                      className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left"
                    >
                      <span className="text-lg sm:text-xl">🏠</span>
                      <span className="text-sm sm:text-base font-medium">
                        Home Page
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/MyPost')}
                      className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left"
                    >
                      <span className="text-lg sm:text-xl">⚡</span>
                      <span className="text-sm sm:text-base font-medium">
                        My Post
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/saved-posts')}
                      className="flex items-center gap-2 sm:gap-3 text-gray-600 hover:text-red-500 transition-colors p-2 rounded-lg sm:rounded-xl hover:bg-gray-50 w-full text-left"
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
                            (activeCategory === catName)
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
                {posts.length === 0 ? (
                  <div className="flex items-center justify-center h-40 text-lg text-gray-400">
                    No posts yet!
                  </div>
                ) : (
                  <div>
                    {posts.map((post) => (
                      <div
                        key={post.id}
                        className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-100 overflow-hidden mb-4"
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
                )}
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
                    placeholder="Search......"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-gray-300 rounded-xl sm:rounded-2xl focus:outline-none text-sm sm:text-base bg-transparent"
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

export default CommunityPage;