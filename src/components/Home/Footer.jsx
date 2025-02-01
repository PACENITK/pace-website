import React, { forwardRef } from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';
import PropTypes from 'prop-types';

const SectionTitle = ({ children, centered }) => (
  <h3 className={`text-white text-lg font-semibold mb-4 inline-block relative
    after:content-[''] after:block after:w-1/2 after:h-0.5 
    after:bg-gradient-to-r after:from-blue-400 after:to-transparent 
    after:mt-1 
    ${centered ? 'w-full text-center after:mx-auto after:left-1/4' : ''}`}>
    {children}
  </h3>
);

SectionTitle.propTypes = {
  children: PropTypes.node.isRequired,
  centered: PropTypes.bool
};

SectionTitle.defaultProps = {
  centered: false
};

// Main Footer Component
const Footer = forwardRef((_, ref) => {
  const footerData = {
    quickLinks: {
      title: "Quick Links",
      links: [
        { name: "NITK Surathkal", url: "https://www.nitk.ac.in/" },
        { name: "CE NITK Surathkal", url: "https://civil.nitk.ac.in/" },
        { name: "PACE NITK Surathkal", url: "#" }
      ]
    },
    paceLinks: {
      title: "PACE Links",
      links: [
        { name: "Events", url: "/events" },
        { name: "Projects", url: "/projects" },
        { name: "Team", url: "/team" }
      ]
    },
    moreLinks: {
      title: "More Links",
      links: [
        { name: "CE Courses", url: "https://civil.nitk.ac.in/courses" },
        { name: "CE Faculties", url: "https://civil.nitk.ac.in/people" },
        { name: "CE Achievements", url: "https://civil.nitk.ac.in/achievements" }
      ]
    },
    socialLinks: [
      { icon: FaFacebook, link: '#', name: 'Facebook' },
      { icon: FaTwitter, link: '#', name: 'Twitter' },
      { icon: FaInstagram, link: '#', name: 'Instagram' },
      { icon: FaLinkedin, link: '#', name: 'LinkedIn' },
      { icon: FaYoutube, link: '#', name: 'YouTube' },
    ],
    contactInfo: {
      title: "Contact Us",
      details: [
        { icon: FaMapMarkerAlt, text: "Department of Civil Engineering, NITK Surathkal, Mangalore - 575025" },
        { icon: FaPhone, text: "+91-0824-2473041" },
        { icon: FaEnvelope, text: "pace@nitk.edu.in" }
      ]
    }
  };

  const LinkSection = ({ title, links }) => (
    <div>
      <SectionTitle>{title}</SectionTitle>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.name}>
            <a 
              href={link.url}
              className="hover:text-white transition-colors duration-200"
            >
              {link.name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );

  LinkSection.propTypes = {
    title: PropTypes.string.isRequired,
    links: PropTypes.arrayOf(PropTypes.shape({
      name: PropTypes.string.isRequired,
      url: PropTypes.string.isRequired
    })).isRequired
  };

  return (
    <footer ref={ref} className="bg-gradient-to-br from-purple-900 via-blue-900 to-black text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <LinkSection title={footerData.quickLinks.title} links={footerData.quickLinks.links} />
          <LinkSection title={footerData.paceLinks.title} links={footerData.paceLinks.links} />
          <LinkSection title={footerData.moreLinks.title} links={footerData.moreLinks.links} />
          <div>
            <SectionTitle>{footerData.contactInfo.title}</SectionTitle>
            <div className="space-y-4">
              {footerData.contactInfo.details.map((item, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-5 mt-1 mr-3">
                    <item.icon className="text-blue-400 w-full h-full" />
                  </div>
                  <span className="flex-1">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col items-center">
            <SectionTitle centered>Our Social Media Platforms</SectionTitle>
            <div className="flex justify-center space-x-6">
              {footerData.socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.link}
                  className="text-gray-400 hover:text-white transform hover:scale-110 transition-all duration-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <social.icon className="h-6 w-6" />
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Designed by <span className="font-bold">Web Team</span> | <span className="font-bold">PACE</span> | <span className="font-bold">NITK Surathkal</span></p>
          <p> All rights reserved. </p>
        </div>
      </div>
    </footer>
  );
});

Footer.displayName = 'Footer'; // Set display name for better debugging
export default Footer;