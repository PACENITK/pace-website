import React from 'react';
import { Link } from 'react-router-dom';
import TeamNavbar from '../components/Team/TeamNavbar';
import Footer from '../components/Home/Footer';

const Projects = () => {
  return (
    <div className="min-h-screen bg-sky-50">
      <TeamNavbar />
      <div className="pt-32 pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Projects</h1>
          <p className="text-lg text-gray-700">
            Explore our various projects and initiatives in civil engineering.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link 
            to="/projects/expo" 
            className="group"
          >
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-[1.02]">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Project Expo</h2>
                  <p className="text-gray-300">
                    Explore our showcase of innovative projects presented at our annual expo.
                  </p>
                </div>
              </div>
            </div>
          </Link>

          <Link 
            to="/projects/hosted-projects" 
            className="group"
          >
            <div className="bg-gray-800 rounded-lg overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform group-hover:scale-[1.02]">
              <div className="relative">
                <img
                  src="https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?auto=format&fit=crop&q=80&w=2728&ixlib=rb-4.0.3"
                  alt="Hosted Projects"
                  className="w-full h-64 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Hosted Projects</h2>
                  <p className="text-gray-300">
                    Discover our collection of ongoing and completed collaborative projects.
                  </p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Projects;