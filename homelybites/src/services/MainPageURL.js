import axios from "axios";

export const BASE_URL = "http://localhost:8000/api";

export const recipeAPI = {
  getRecipes: (params) => axios.get(`${BASE_URL}/recipes/`, { params }),
  getRecipeById: (id) => axios.get(`${BASE_URL}/recipes/${id}`),
  // getRecommendations: () => axios.get(`${BASE_URL}/recommendations/hybrid/`),
  getWhatOthersAreCooking: () => axios.get(`${BASE_URL}/recipes/recommended/`),

  getRecipeByCategory: async (category, page = 1) => {
    try {
      const response = await axios.get(
        `${BASE_URL}/recipes/recommended/`,
        {
          params: { 
            category: category,
            page: page, 
            limit: 14 
          },
        }
      );
      return response;
    } catch (error) {
      console.log(`Error Fetching ${category} recipes:`, error);
      throw error;
    }
  },
};
