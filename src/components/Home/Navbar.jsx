import { useState, useEffect } from "react";
import { Menu, X, ChevronDown } from "lucide-react";
import logo from '../../assets/logoo.png';

const Navbar = ({ scrollToFooter, isHomePage = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [projectsDropdownOpen, setProjectsDropdownOpen] = useState(false);
  const [mobileProjectsDropdownOpen, setMobileProjectsDropdownOpen] = useState(false);

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

  const handleClickOutside = (e) => {
    // Prevent this from triggering when clicking the dropdown toggle itself
    if (!e.target.closest('.projects-dropdown-toggle')) {
      setProjectsDropdownOpen(false);
    }
  };

  useEffect(() => {
    if (projectsDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [projectsDropdownOpen]);

  // Close mobile dropdown when main menu is closed
  useEffect(() => {
    if (!isOpen) {
      setMobileProjectsDropdownOpen(false);
    }
  }, [isOpen]);

  const navItems = [
    { name: "HOME", path: "/" },
    { name: "EVENTS", path: "/events" },
    { 
      name: "PROJECTS", 
      path: "/projects",
      hasDropdown: true,
      dropdownItems: [
        { name: "PROJECT EXPO", path: "/projects/expo" },
        { name: "HOSTED PROJECTS", path: "/projects/hosted-projects" }
      ]
    },
    { name: "TEAM", path: "/team" },
    { name: "NIRMAAN", path: "/nirmaan" },
    { name: "ASCE", path: "https://ascenitk.wordpress.com/" },
    // { name: "CONTACT US", path: "#", action: scrollToFooter },
  ];

  const isExternalLink = (path) => path.startsWith('http');

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-200 ease-in-out
        ${!isHomePage ? 'bg-white' : scrolled ? 'bg-white shadow-md' : 'bg-transparent'}
        ${!isHomePage ? '' : isOpen ? 'bg-white' : ''}`}
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center pl-0 pr-0 py-2">
          {/* Logo and title section */}
          <div className="flex items-center space-x-2 md:space-x-4 -ml-4 md:-ml-8">
            <div className="w-16 h-12 md:w-32 md:h-16 flex items-center justify-center overflow-hidden">
              <img
                src={logo}
                alt="PACE Logo"
                className="w-full h-full object-contain transform transition-transform duration-150 hover:scale-110 cursor-pointer"
                onClick={() => window.location.href = '/'}
              />
            </div>
            <div className="flex flex-col">
              <p className={`text-sm md:text-lg font-medium transition-colors duration-150 ${!isHomePage || scrolled || isOpen ? 'text-black' : 'text-white'}`}>
              Professional Association for Civil Engineering
              </p>
              <p className={`text-xs md:text-sm transition-colors duration-150 ${!isHomePage || scrolled || isOpen ? 'text-black' : 'text-white'}`}>
                National Institute of Technology Karnataka, Surathkal
              </p>
            </div>
          </div>

          {/* Desktop Navigation and Mobile Button Wrapper */}
          <div className="flex items-center lg:space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-6 mr-0">
              {navItems.map((item) => (
                <div key={item.name} className="relative">
                  {item.hasDropdown ? (
                    <div>
                      <button
                        className={`projects-dropdown-toggle flex items-center text-base font-medium px-3 py-2 rounded transition-colors duration-150
                          ${!isHomePage || scrolled ? 'text-gray-700 hover:text-blue-600 hover:bg-gray-100' : 'text-white hover:text-gray-300'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProjectsDropdownOpen(!projectsDropdownOpen);
                        }}
                      >
                        {item.name}
                        <ChevronDown size={16} className="ml-1" />
                      </button>
                      {projectsDropdownOpen && (
                        <div className="absolute left-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 overflow-hidden">
                          <div className="py-1">
                            {item.dropdownItems.map((dropdownItem) => (
                              <a
                                key={dropdownItem.name}
                                href={dropdownItem.path}
                                className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 
                                         transition-colors duration-150 border-l-4 border-transparent hover:border-blue-500"
                              >
                                {dropdownItem.name}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <a
                      href={item.path}
                      target={isExternalLink(item.path) ? '_blank' : undefined}
                      rel={isExternalLink(item.path) ? 'noopener noreferrer' : undefined}
                      onClick={(e) => {
                        if (item.action) {
                          e.preventDefault();
                          item.action();
                        }
                      }}
                      className={`text-base font-medium px-3 py-2 rounded transition-all duration-150 ease-in-out
                        ${!isHomePage || scrolled ? 'text-gray-700 hover:text-blue-600 hover:bg-gray-100' : 'text-white hover:text-gray-300'}
                        hover:scale-105`}
                    >
                      {item.name}
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`lg:hidden p-2 rounded-md transition-all duration-150 ml-4
                ${!isHomePage || scrolled || isOpen ? 'text-gray-700 hover:text-blue-600' : 'text-white hover:text-gray-300'}
                focus:outline-none`}
              aria-label="Toggle menu"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div 
          className={`lg:hidden border-t border-gray-200 bg-white transition-all duration-200 ease-in-out
            ${isOpen ? 'block opacity-100 max-h-screen' : 'hidden opacity-0 max-h-0'}`}
        >
          {navItems.map((item) => (
            <div key={item.name}>
              {item.hasDropdown ? (
                <>
                  <button
                    onClick={() => setMobileProjectsDropdownOpen(!mobileProjectsDropdownOpen)}
                    className="w-full text-left px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 
                            transition-colors duration-150 flex items-center justify-between"
                  >
                    {item.name}
                    <ChevronDown 
                      size={16} 
                      className={`transition-transform duration-200 ${mobileProjectsDropdownOpen ? 'transform rotate-180' : ''}`} 
                    />
                  </button>
                  <div 
                    className={`bg-gray-50 border-l-4 border-blue-500 overflow-hidden transition-all duration-200
                      ${mobileProjectsDropdownOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'}`}
                  >
                    {item.dropdownItems.map((dropdownItem) => (
                      <a
                        key={dropdownItem.name}
                        href={dropdownItem.path}
                        onClick={() => setIsOpen(false)}
                        className="block px-8 py-3 text-base font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 
                                transition-colors duration-150"
                      >
                        {dropdownItem.name}
                      </a>
                    ))}
                  </div>
                </>
              ) : (
                <a
                  href={item.path}
                  target={isExternalLink(item.path) ? '_blank' : undefined}
                  rel={isExternalLink(item.path) ? 'noopener noreferrer' : undefined}
                  onClick={(e) => {
                    setIsOpen(false);
                    if (item.action) {
                      e.preventDefault();
                      item.action();
                    }
                  }}
                  className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-blue-600 
                          transition-all duration-150 ease-in-out hover:scale-105"
                >
                  {item.name}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;