import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Events from './pages/Events';
import Projects from './pages/Projects';
import TeamPage from './components/Team/Team';
import Nirman from './components/Nirman/Nirman';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/nirman" element={<Nirman />} />
      </Routes>
    </Router>
  );
}

export default App;