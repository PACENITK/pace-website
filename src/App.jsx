import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Events from './pages/Events';
import Projects from './pages/Projects';
import Expo from './pages/projects/Expo';
import HostedProjects from './pages/projects/HostedProjects';
import ExpoProjectDetail from './pages/projects/expo/[id]';
import HostedProjectDetail from './pages/projects/hosted-projects/[id]';
import Nirman from './components/Nirman/Nirman';
import TeamPage from './components/Team/Team';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/expo" element={<Expo />} />
        <Route path="/projects/hosted-projects" element={<HostedProjects />} />
        <Route path="/projects/expo/:id" element={<ExpoProjectDetail />} />
        <Route path="/projects/hosted-projects/:id" element={<HostedProjectDetail />} />
        <Route path="/nirman" element={<Nirman />} />
        <Route path="/team" element={<TeamPage />} />
      </Routes>
    </Router>
  );
}

export default App;