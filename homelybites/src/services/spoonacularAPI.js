import axios from "axios";

const SPOONACULAR_API_KEY = "28757902a1544a44b3466566d399895d"; 
const BASE_URL = "https://api.spoonacular.com/";

export const getRecommendedRecipes = async (limit = 4) => {
  const response = await axios.get(${BASE_URL}/recipes/random, {
    params: {
      number: limit,
      apiKey: SPOONACULAR_API_KEY,
    },
  });
  return response.data.recipes; 
};