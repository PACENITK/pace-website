import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Events from './pages/Events';
import Projects from './pages/Projects';
import Expo from './pages/projects/Expo';
import HostedProjects from './pages/projects/HostedProjects';
import ExpoProjectDetail from './pages/projects/expo/[id]';
import HostedProjectDetail from './pages/projects/hosted-projects/[id]';
import Nirmaan from './components/Nirmaan/Nirmaan';
import TeamPage from './components/Team/Team';
import PortalRoutes from './portal/PortalRoutes';
import { useEffect } from "react";
import AOS from "aos";

function App() {

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);
  
  console.log('App component rendered');
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<Events />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/expo" element={<Expo />} />
        <Route path="/projects/hosted-projects" element={<HostedProjects />} />
        <Route path="/projects/expo/:id" element={<ExpoProjectDetail />} />
        <Route path="/projects/hosted-projects/:id" element={<HostedProjectDetail />} />
        <Route path="/nirmaan" element={<Nirmaan />} />
        <Route path="/team" element={<TeamPage />} />
        
        {/* Scaffolding Portal Routes */}
        <Route path="/portal/*" element={<PortalRoutes />} />
      </Routes>
    </Router>
  );
}


export default App;