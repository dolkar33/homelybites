import axios from "axios";

export const BASE_URL = "http://localhost:8000/api";

export const recipeAPI = {
  getRecipes: (params) => axios.get(`${BASE_URL}/recipes/`, { params }),
  getRecipeById: (id) => axios.get(`${BASE_URL}/recipes/${id}`),
  // getRecommendations: () => axios.get(`${BASE_URL}/recommendations/hybrid/`),
  getWhatOthersAreCooking: () => axios.get(`${BASE_URL}/recipes/recommended/`),
  getCategories: () => axios.get(`${BASE_URL}/categories/`),

  getRecipeByCategory: async (category, page = 1) => {
    try {
      const response = await axios.get(`${BASE_URL}/recipes/by_category/`, {
        params: {
          slug: category, // Use slug parameter for by_category action
        },
      });
      return response;
    } catch (error) {
      console.log(`Error Fetching ${category} recipes:`, error);
      throw error;
    }
  },
};
