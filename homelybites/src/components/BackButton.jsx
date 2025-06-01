import React from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const BackButton = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <button onClick={handleBackClick} className="flex items-center">
      <ChevronLeft size={20} className="text-accent" />
      <span className="ml-1 text-sm sm:text-base font-medium">Back</span>
    </button>
  );
};

export default BackButton;
