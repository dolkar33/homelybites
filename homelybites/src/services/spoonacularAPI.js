import axios from "axios";

const BACKEND_URL = "http://localhost:8000/api";

export const getRecommendedRecipes = async (limit = 4) => {
  const response = await axios.get(`${BACKEND_URL}/recipes/recommended/`, {
    params: {
      limit: limit,
    },
  });
  return response.data.results || response.data;
};

export const getPopularRecipes = async (limit = 4) => {
  const response = await axios.get(`${BACKEND_URL}/recipes/popular/`, {
    params: {
      limit: limit,
    },
  });
  return response.data.results || response.data;
};

export const getRecentRecipes = async (limit = 8) => {
  const response = await axios.get(`${BACKEND_URL}/recent/recent/`, {
    params: {
      limit: limit,
    },
  });
  return response.data.results || response.data;
};

export const getRecipesByCategory = async (category, limit = 9) => {
  const response = await axios.get(`${BACKEND_URL}/recipes/`, {
    params: {
      category: category,
      limit: limit,
    },
  });
  return response.data.results || response.data;
};
