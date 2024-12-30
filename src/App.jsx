import Footer from './components/Footer';
import Navbar from './components/Navbar';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      <Navbar />
      <main className="flex-grow mt-16">
        {/* hero section */}
        <div className="flex flex-col items-center justify-center h-[70vh] max-w-7xl mx-auto px-4">
          <h1 className="text-5xl font-extrabold text-center text-gray-800">
            Welcome to PACE
          </h1>
          <p className="text-center mt-6 text-lg text-gray-600">
            Professional Association of Civil Engineers
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
