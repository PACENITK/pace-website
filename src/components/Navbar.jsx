import { useState } from "react";
import { Menu, X } from "lucide-react";
import logo from '../assets/logo.png';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: "Projects", path: "/projects" },
    { name: "Team", path: "/team" },
    { name: "Gallery", path: "/gallery" },
    { name: "Contact", path: "/contact" },
  ];

  return (
    <nav className="bg-white shadow-lg fixed w-full z-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center px-4 py-2">
{/* logo and title section - added scale transform */}
          <div className="flex items-center space-x-4">
            <div className="w-32 h-16 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="PACE Logo"
                className="w-full h-full object-contain scale-150 transform hover:scale-155 transition-transform duration-200"
              />
            </div>
            <div className="flex flex-col">
              <p className="text-lg font-semibold text-black">
                Professional Association of Civil Engineers
              </p>
              <p className="text-sm text-black">
                National Institute of Technology Karnataka Surathkal
              </p>
            </div>
          </div>

{/* desktop navigation */}
          <div className="hidden lg:flex items-center space-x-6">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                className="text-base text-gray-700 hover:text-blue-600 font-medium px-3 py-2 rounded transition duration-150 ease-in-out hover:bg-gray-50"
              >
                {item.name}
              </a>
            ))}
          </div>

{/* mobile navigation button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

{/* mobile navigation menu */}
        {isOpen && (
          <div className="lg:hidden border-t border-gray-200">
            {navItems.map((item) => (
              <a
                key={item.name}
                href={item.path}
                className="block px-4 py-2 text-base text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition duration-150 ease-in-out"
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}