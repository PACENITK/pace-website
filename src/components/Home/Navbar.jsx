import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from '../../assets/logoo.png';

const Navbar = ({ scrollToFooter }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "EVENTS", path: "/events" },
    { name: "PROJECTS", path: "/projects" },
    { name: "TEAM", path: "/team" },
    { name: "NIRMAN", path: "/nirman" },
    { name: "CONTACT US", path: "#", action: scrollToFooter },
  ];

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-200 ease-in-out
        ${scrolled ? 'bg-white shadow-md' : 'bg-transparent'}
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
                className="w-full h-full object-contain transform transition-transform duration-150 hover:scale-110 cursor-pointer"
                onClick={() => window.location.href = '/'}
              />
            </div>
            <div className="flex flex-col">
              <p className={`text-lg font-semibold transition-colors duration-150 ${scrolled || isOpen ? 'text-black' : 'text-white'}`}>
                Professional Association of Civil Engineers
              </p>
              <p className={`text-sm transition-colors duration-150 ${scrolled || isOpen ? 'text-black' : 'text-white'}`}>
                National Institute of Technology Karnataka Surathkal
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                onClick={(e) => {
                  if (item.action) {
                    e.preventDefault(); // Prevents jumping to the top
                    item.action();
                  }
                }}
                className={`text-base font-medium px-3 py-2 rounded transition-all duration-150 ease-in-out
                  ${scrolled ? 'text-gray-700 hover:text-blue-600 hover:bg-gray-100' : 'text-white hover:text-gray-300'}
                  hover:scale-105`}
              >
                {item.name}
              </a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`lg:hidden p-2 rounded-md transition-all duration-150
              ${scrolled || isOpen ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-gray-300'}
              focus:outline-none`}
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`lg:hidden border-t border-gray-200 bg-white transition-all duration-200 ease-in-out
            ${isOpen ? 'block opacity-100' : 'hidden opacity-0'}`}
        >
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.path}
              onClick={(e) => {
                setIsOpen(false);
                if (item.action) {
                  e.preventDefault(); // Prevents jumping to the top
                  item.action();
                }
              }}
              className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-100 hover:text-blue-600 
                       transition-all duration-150 ease-in-out hover:scale-105"
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
