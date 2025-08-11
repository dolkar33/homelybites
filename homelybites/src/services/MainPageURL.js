//import axios from "axios";
import api from './api'; // adjust to your default export
export const BASE_URL = "http://localhost:8000/api";

export const recipeAPI = {
  getRecipes: (params) => api.get(`${BASE_URL}/recipes/`, { params }),
  getRecipeById: (id) => api.get(`${BASE_URL}/recipes/${id}`),
  // getRecommendations: () => axios.get(`${BASE_URL}/recommendations/hybrid/`),
  // Always normalize paginated/unpaginated responses to an array
  getWhatOthersAreCooking: async () => {
    const res = await api.get(`${BASE_URL}/recipes/recommended/`, {
      params: { page: 1, page_size: 14 },
    });
    const data = res.data;
    // Return a consistent shape: { items, count, next, previous }
    if (Array.isArray(data)) {
      return { items: data, count: data.length, next: null, previous: null };
    }
    return {
      items: data.results || [],
      count: data.count ?? (data.results ? data.results.length : 0),
      next: data.next || null,
      previous: data.previous || null,
    };
  },

  getRecipeByCategory: async (category, page = 1) => {
    try {
      const response = await api.get(`${BASE_URL}/recipes/recommended/`, {
        params: {
          category: category,
          page: page,
          page_size: 14, // DRF PageNumberPagination common param
        },
      });
      const data = response.data;
      if (Array.isArray(data)) {
        return { items: data, count: data.length, next: null, previous: null };
      }
      return {
        items: data.results || [],
        count: data.count ?? (data.results ? data.results.length : 0),
        next: data.next || null,
        previous: data.previous || null,
      };
    } catch (error) {
      console.log(`Error Fetching ${category} recipes:`, error);
      throw error;
    }
  },
};
