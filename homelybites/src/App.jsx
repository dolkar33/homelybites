import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect, useState } from "react";
import SignUp from "./pages/signup";
import LandingPage from "./pages/LandingPage";
import UserQuestion from "./pages/UserQuestion";
import Login from "./pages/login";
import MainPage from "./pages/MainPage";
import UserProfile from "./pages/UserProfile";
import ContactUs from "./pages/ContactUs";
import AboutUs from "./pages/AboutUs";
import CommunityPage from "./pages/CommunityPage";
import Post from "./pages/Post";
import MyPost from "./pages/MyPost";
import RecipeSearchPage from "./pages/SearchPage";
import RecipePage from "./pages/RecipePage";
import FavPage from "./pages/FavPage";

import RecipeDetailPage from "./pages/RecipeDetailPage";
import RecentRecipes from "./pages/RecentRecipes";
import UserPage from "./pages/UserPage";
import { CustomToaster } from "./pages/toast";

// Custom hook to check authentication status
const useAuth = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const currentUser = localStorage.getItem("currentUser");
        if (currentUser) {
          const user = JSON.parse(currentUser);
          setIsLoggedIn(user.isLoggedIn === true);
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        setIsLoggedIn(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  return { isLoggedIn, isLoading };
};

// Component to handle root path logic
const RootRoute = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return isLoggedIn ? <Navigate to="/Home" replace /> : <LandingPage />;
};

// Component to protect UserQuestion route from logged-in users
// const UserQuestionRoute = () => {
//   const { isLoggedIn, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="text-lg">Loading...</div>
//       </div>
//     );
//   }

//   // If user is already logged in, redirect to Home instead of showing UserQuestion
//   return isLoggedIn ? <Navigate to="/Home" replace /> : <UserQuestion />;
// };

// Component to protect Login route from logged-in users
const LoginRoute = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is already logged in, redirect to Home instead of showing Login
  return isLoggedIn ? <Navigate to="/Home" replace /> : <Login />;
};

// Component to protect SignUp route from logged-in users
const SignUpRoute = () => {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If user is already logged in, redirect to Home instead of showing SignUp
  return isLoggedIn ? <Navigate to="/Home" replace /> : <SignUp />;
};

function App() {
  return (
    <>
      <CustomToaster />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/userquestion" element={<UserQuestion />} />
        <Route path="/Home" element={<MainPage />} />
        <Route path="/" element={<RootRoute />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/userprofile" element={<UserProfile />} />
        <Route path="/aboutus" element={<AboutUs />} />
        <Route path="/community" element={<CommunityPage />} />
        <Route path="/MyPost" element={<MyPost />} />
        <Route path="/post" element={<Post />} />
        <Route path="/recipe" element={<RecipeSearchPage />} />
        <Route path="/recipepage" element={<RecipePage />} />
        <Route path="/recipes/:slug" element={<RecipeDetailPage />} />
        <Route path="/recent" element={<RecentRecipes />} />
        <Route path="/FavPage" element={<FavPage />} />
        <Route path="/saved-posts" element={<FavPage />} />
        <Route path="/userpage" element={<UserPage />} />
        <Route path="" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
