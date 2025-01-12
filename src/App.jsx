import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ActivityLog from './components/ActivityLog/ActivityLog';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <ActivityLog />
      </main>
      <Footer />
    </div>
  );
}

export default App;