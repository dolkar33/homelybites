import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Recommendations from "./pages/Recommendations";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/recommendations" element={<Recommendations />} />
      </Routes>
    </Router>
  );
}

export default App;
