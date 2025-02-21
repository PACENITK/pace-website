import { FaLinkedin, FaTwitter, FaInstagram, FaUserCircle } from 'react-icons/fa';
import { useState } from 'react';
import TeamNavbar from './TeamNavbar';
import Footer from '../Home/Footer';
import './Team.css';

const ProfileCard = ({ name, role, socialLinks }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className={`relative w-[320px] bg-white/95 rounded-xl p-6 transition-all duration-500 ease-out profile-card-float
        ${isHovered ? 'shadow-[0_0_30px_rgba(79,70,229,0.15)]' : 'shadow-lg'}
        border border-indigo-50 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute -top-16 left-1/2 transform -translate-x-1/2">
        <div className={`w-48 h-48 rounded-full flex items-center justify-center transition-all duration-500
          bg-gradient-to-b from-indigo-50 via-white to-purple-50
          ${isHovered ? 'scale-105 rotate-3' : ''}
          shadow-[0_0_20px_rgba(79,70,229,0.2)]
          border-4 border-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/30 via-transparent to-purple-100/30 animate-pulse"></div>
          <FaUserCircle 
            className={`transition-all duration-500 transform text-indigo-300
              ${isHovered ? 'scale-110' : ''}`} 
            size={120} 
          />
        </div>
      </div>

      <div className="mt-36 text-center">
        <h3 className="text-xl font-bold mb-3 text-black">
          {name}
        </h3>
        <p className="text-lg font-bold text-black mb-6">
          {role}
        </p>
        <div className="flex justify-center space-x-6">
          {socialLinks.linkedin && (
            <a 
              href={socialLinks.linkedin} 
              className="text-[#0077b5] transform transition-all duration-300 hover:scale-125 hover:-translate-y-1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FaLinkedin size={22} />
            </a>
          )}
          {socialLinks.twitter && (
            <a 
              href={socialLinks.twitter} 
              className="text-[#1DA1F2] transform transition-all duration-300 hover:scale-125 hover:-translate-y-1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FaTwitter size={22} />
            </a>
          )}
          {socialLinks.instagram && (
            <a 
              href={socialLinks.instagram} 
              className="text-[#E4405F] transform transition-all duration-300 hover:scale-125 hover:-translate-y-1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FaInstagram size={22} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionTitle = ({ title }) => (
  <div className="relative mb-32 group">
    <div className="relative flex justify-center">
      <h2 className="title-underline px-8 text-5xl font-bold text-black">
        {title}
      </h2>
    </div>
  </div>
);

const TeamPage = () => {
  const leadership = [
    {
      name: "Dr. John Doe",
      role: "Head of Department",
      socialLinks: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com",
      }
    },
    {
      name: "Prof. Jane Smith",
      role: "Faculty Advisor",
      socialLinks: {
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      }
    }
  ];

  const convenor = {
    name: "Alex Johnson",
    role: "Convenor",
    socialLinks: {
      linkedin: "https://linkedin.com",
      twitter: "https://twitter.com",
      instagram: "https://instagram.com",
    }
  };

  const coreTeam = [
    {
      name: "Sarah Wilson",
      role: "Core Member",
      socialLinks: {
        linkedin: "https://linkedin.com",
        instagram: "https://instagram.com",
      }
    },
    {
      name: "Mike Brown",
      role: "Core Member",
      socialLinks: {
        linkedin: "https://linkedin.com",
        twitter: "https://twitter.com",
      }
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <TeamNavbar />
      <div className="flex-grow">
        <div className="pt-24">
          <div className="relative py-28 px-4 overflow-hidden hero-background">
            <div className="max-w-4xl mx-auto text-center relative">
              <div className="inline-block relative">
                <h1 className="text-6xl font-bold mb-6 text-black">
                  Meet Our Team
                </h1>
              </div>
              <p className="text-black text-xl max-w-2xl mx-auto font-medium mt-8">
                "Building tomorrow's infrastructure with today's innovation"
              </p>
              <div className="title-underline w-40 mx-auto"></div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-4 py-16">
            <SectionTitle title="Leadership" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 justify-items-center max-w-4xl mx-auto mb-32">
              {leadership.map((member, index) => (
                <ProfileCard key={index} {...member} />
              ))}
            </div>

            <div className="mt-32">
              <SectionTitle title="Convenor" />
              <div className="flex justify-center mb-32">
                <ProfileCard {...convenor} />
              </div>
            </div>

            <div className="mt-32">
              <SectionTitle title="Core Team" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 justify-items-center mb-32">
                {coreTeam.map((member, index) => (
                  <ProfileCard key={index} {...member} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default TeamPage;