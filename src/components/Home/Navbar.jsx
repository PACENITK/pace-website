import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from '../assets/logoo.png';

const Navbar = ({ scrollToFooter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setScrolled(offset > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "EVENTS", path: "/events" },
    { name: "PROJECTS", path: "/projects" },
    { name: "TEAM", path: "/team" },
    { name: "GALLERY", path: "/gallery" },
    { name: "CONTACT US", path: "#", action: scrollToFooter }, // Action to scroll to footer
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ease-in-out
        ${scrolled ? 'bg-white shadow-lg' : 'bg-transparent'}
        ${isOpen ? 'bg-white' : ''}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 py-2">
          {/* Logo and title section */}
          <div className="flex items-center space-x-4">
            <div className="w-32 h-16 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="PACE Logo"
                className="w-full h-full object-contain scale-150 transform hover:scale-155 transition-transform duration-200 cursor-pointer"
                onClick={() => window.location.href = '/'} // Reload page from the top
              />
            </div>
            <div className="flex flex-col">
              <p className={`text-lg font-semibold transition-colors duration-300 ${scrolled || isOpen ? 'text-black' : 'text-white'}`}>
                Professional Association of Civil Engineers
              </p>
              <p className={`text-sm transition-colors duration-300 ${scrolled || isOpen ? 'text-black' : 'text-white'}`}>
                National Institute of Technology Karnataka Surathkal
              </p>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                onClick={() => { if (item.action) item.action(); }} // Handle click for scroll action
                className={`text-base font-medium px-3 py-2 rounded transition duration-300 ease-in-out
                  ${scrolled ? 'text-gray-700 hover:text-blue-600 hover:bg-gray-50' : 'text-white hover:text-gray-200 hover:bg-white/10'}`}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Mobile navigation button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-md transition-colors duration-300
              ${scrolled || isOpen ? 'text-gray-700 hover:text-blue-600 hover:bg-gray-100' : 'text-white hover:text-gray-200 hover:bg-white/10'}
              focus:outline-none`}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile navigation menu */}
        <div 
          className={`lg:hidden border-t border-gray-200 bg-white transition-all duration-300 ease-in-out
            ${isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}
        >
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              onClick={() => {
                setIsOpen(false);
                if (item.action) item.action(); // Handle scroll action if defined
              }}
              className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-50 hover:text-blue-600 
                       transition duration-150 ease-in-out"
            >
              {item.name}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;