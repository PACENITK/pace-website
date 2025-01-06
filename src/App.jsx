import React from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ActivityLog from './components/ActivityLog';
import Footer from './components/Footer';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <ActivityLog />
      </main>
      <Footer />
    </div>
  );
}