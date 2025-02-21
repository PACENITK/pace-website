import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Link } from 'react-router-dom';
import logo from '../assets/logoo.png';

const TeamNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "PROJECTS", path: "/projects" },
    { name: "EVENTS", path: "/events" },
    { name: "NIRMAN", path: "/nirman" },
  ];

  return (
    <nav className="fixed w-full z-50 bg-white shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-6 py-3">
          {/* Logo and title section */}
          <div className="flex items-center space-x-4">
            <div className="w-32 h-16 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="PACE Logo"
                className="w-full h-full object-contain transform transition-transform duration-300 hover:scale-110 cursor-pointer"
                onClick={() => window.location.href = '/'}
              />
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-bold text-gray-800">
                Professional Association of Civil Engineers
              </p>
              <p className="text-sm font-medium text-gray-600">
                National Institute of Technology Karnataka Surathkal
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center">
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className="text-base font-semibold px-5 py-2 mx-1 rounded-md
                  text-gray-700 hover:text-blue-600 hover:bg-blue-50
                  transition-all duration-300 ease-in-out transform hover:scale-105
                  border-b-2 border-transparent hover:border-blue-600"
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md transition-all duration-300
              text-gray-700 hover:text-blue-600 hover:bg-blue-50
              focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`lg:hidden border-t border-gray-100 bg-white
            transition-all duration-300 ease-in-out
            ${isOpen ? 'block opacity-100' : 'hidden opacity-0'}`}
        >
          {navItems.map((item) => (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className="block px-6 py-3 text-base font-medium text-gray-700
                hover:bg-blue-50 hover:text-blue-600
                transition-all duration-300 ease-in-out
                border-l-4 border-transparent hover:border-blue-600"
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default TeamNavbar;