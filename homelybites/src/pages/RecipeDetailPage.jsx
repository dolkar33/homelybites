import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { recipeAPI } from '../services/api';
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BackButton from "../components/BackButton";

const RecipeDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipeDetails = async () => {
      try {
        setLoading(true);
        const response = await recipeAPI.getRecipe(slug);
        setRecipe(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch recipe details.');
        console.error('Error fetching recipe details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeDetails();
  }, [slug]);

  if (loading) {
    return <div className="text-center py-8">Loading recipe details...</div>;
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        {error}
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 underline">Go Back</button>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="text-center py-8">
        Recipe not found.
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-500 underline">Go Back</button>
      </div>
    );
  }

  // Split ingredients and instructions into lists and trim whitespace
  const ingredientsList = recipe.ingredients ? recipe.ingredients.split('\n').map(item => item.trim()).filter(item => item !== '') : [];
  const instructionsList = recipe.instructions ? recipe.instructions.split('\n').map(item => item.trim()).filter(item => item !== '') : [];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="max-w-5xl mx-auto w-full px-4 py-8">
        <BackButton />
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 text-center">{recipe.title}</h1>
        
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="rounded-xl w-full h-64 object-cover mb-6"
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column: Ingredients and Nutritional Info */}
          <div className="flex flex-col">
            {/* Ingredients Section */}
            <div>
              <h2 className="text-2xl font-bold text-gray-700 mb-4">Ingredients</h2>
              {ingredientsList.length > 0 ? (
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  {ingredientsList.map((ingredient, index) => (
                    <li key={index}>{ingredient}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">No ingredients listed.</p>
              )}
            </div>
            
            {/* Nutritional Information */}
            {(recipe.calories || recipe.fat || recipe.sugar || recipe.protein || recipe.carbohydrates) && (
              <div className="mt-6 p-4 bg-accent text-white rounded-lg shadow w-full">
                <h2 className="text-2xl font-bold mb-4">Nutritional Information</h2>
                <ul className="space-y-2">
                  {recipe.calories && <li><strong>Calories:</strong> {recipe.calories}</li>}
                  {recipe.fat && <li><strong>Fat:</strong> {recipe.fat}</li>}
                  {recipe.sugar && <li><strong>Sugar:</strong> {recipe.sugar}</li>}
                  {recipe.protein && <li><strong>Protein:</strong> {recipe.protein}</li>}
                  {recipe.carbohydrates && <li><strong>Carbohydrates:</strong> {recipe.carbohydrates}</li>}
                </ul>
              </div>
            )}
          </div>
          
          {/* Right Column: Instructions */}
          <div>
            <h2 className="text-2xl font-bold text-gray-700 mb-4">Instructions</h2>
            {instructionsList.length > 0 ? (
              <ol className="list-decimal list-inside text-gray-600 space-y-2">
                {instructionsList.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            ) : (
              <p className="text-gray-600">No instructions listed.</p>
            )}
          </div>
        </div>

        {/* Prep and Cook Time */}
        {recipe.prep_time && recipe.cook_time && (
            <div className="mt-6 text-gray-600">
                <p><strong>Preparation Time:</strong> {recipe.prep_time} minutes</p>
                <p><strong>Cook Time:</strong> {recipe.cook_time} minutes</p>
            </div>
        )}

      </div>
      <Footer />
    </div>
  );
};

export default RecipeDetailPage; 