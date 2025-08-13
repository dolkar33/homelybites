import api from "./api"; // adjust to your default export

export const recipeAPI = {
  getRecipes: (params) => api.get(`/recipes/`, { params }),
  getRecipeById: (id) => api.get(`/recipes/${id}`),
  getRecipeBySlug: (slug) => api.get(`/recipes/${slug}/`),
  // getRecommendations: () => axios.get(`${BASE_URL}/recommendations/hybrid/`),

 

  getRecipeByCategory: async (category, page = 1) => {
    try {
      // Use paginated list endpoint with category param; backend accepts slug or name
      const response = await api.get(`/recipes/`, {
        params: {
          category: category,
          page: page,
          page_size: 12, // DRF PageNumberPagination common param
          allergy_filter: 'true',
          diet_filter: 'true',
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
