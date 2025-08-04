import axios from "axios";

export const BASE_URL = "http://localhost:8000/api";

export const recipeAPI = {
  getRecipes: (params) => axios.get(`${BASE_URL}/recipes/`, { params }),
  getRecipeById: (id) => axios.get(`${BASE_URL}/recipes/${id}`),
  // getRecommendations: () => axios.get(`${BASE_URL}/recommendations/hybrid/`),
  getWhatOthersAreCooking: () => axios.get(`${BASE_URL}/recipes/recommended/`),
};
