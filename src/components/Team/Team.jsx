import { FaLinkedin, FaTwitter, FaEnvelope, FaUserCircle } from 'react-icons/fa';
import { SiGooglescholar } from 'react-icons/si'; 
import { useState } from 'react';
import Footer from '../Home/Footer';
import './Team.css';
import teamData from './teamData';
import Navbar from '../Home/Navbar.jsx';

const ProfileCard = ({ name, role, socialLinks, imageSrc }) => {
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
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={`${name}`}
              className={`w-full h-full object-cover rounded-full transition-all duration-500 transform ${isHovered ? 'scale-110' : ''}`}
            />
          ) : (
            <FaUserCircle 
              className={`transition-all duration-500 transform text-indigo-300
                ${isHovered ? 'scale-110' : ''}`} 
              size={120} 
            />
          )}
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
          {socialLinks.email && (
            <a 
              href={`mailto:${socialLinks.email}`} 
              className="text-[#EA4335] transform transition-all duration-300 hover:scale-125 hover:-translate-y-1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <FaEnvelope size={22} />
            </a>
          )}
          {socialLinks.googleScholar && (
            <a 
              href={socialLinks.googleScholar} 
              className="text-[#4285F4] transform transition-all duration-300 hover:scale-125 hover:-translate-y-1" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <SiGooglescholar size={22} />
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
  const { leadership, adminCore, coreTeam,prevadminCore, prevcoreTeam  } = teamData;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Navbar />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-24 justify-items-center mx-auto mb-32">
              <div className="col-span-full flex justify-center gap-24 flex-wrap">
                {leadership.map((member, index) => (
                  <ProfileCard key={index} {...member} />
                ))}
              </div>
            </div>
                {/* Just copy from here */}
            <div className="mt-32">
              <SectionTitle title="Admin Core (2026-2027)" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-24 justify-items-center mb-32">
                <div className="col-span-full flex justify-center gap-24 flex-wrap">
                  {adminCore.map((member, index) => (
                    <ProfileCard key={index} {...member} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-32">
              <SectionTitle title="Core Team (2026-2027)" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 justify-items-center mb-32">
                <div className="col-span-full flex justify-center gap-24 flex-wrap">
                  {coreTeam.map((member, index) => (
                    <ProfileCard key={index} {...member} />
                  ))}
                </div>
              </div>
            </div>

            {/* SIG Heads section moved to appear right after Core Team
            <div className="mt-32">
              <SectionTitle title="SIG Heads" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-24 justify-items-center mb-32">
                <div className="col-span-full flex justify-center gap-24 flex-wrap">
                  {sigHeads.map((member, index) => (
                    <ProfileCard key={index} {...member} />
                  ))}
                </div>
              </div>
            </div> */}

            {/* <div className="mt-32">
              <SectionTitle title="Events Coordinators" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-24 justify-items-center mb-32">
                <div className="col-span-full flex justify-center gap-24 flex-wrap">
                  {eventCoordinators.map((member, index) => (
                    <ProfileCard key={index} {...member} />
                  ))}
                </div>
              </div>
            </div> */}

            {/* <div className="mt-32">
              <SectionTitle title="Media Heads" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-24 justify-items-center mb-32">
                <div className="col-span-full flex justify-center gap-24 flex-wrap">
                  {mediaHeads.map((member, index) => (
                    <ProfileCard key={index} {...member} />
                  ))}
                </div>
              </div>
            </div> */}

            <div className="mt-32">
              <SectionTitle title="Admin Core (2025-2026)" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-24 justify-items-center mb-32">
                <div className="col-span-full flex justify-center gap-24 flex-wrap">
                  {prevadminCore.map((member, index) => (
                    <ProfileCard key={index} {...member} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-32">
              <SectionTitle title="Core Team (2025-2026)" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-24 justify-items-center mb-32">
                <div className="col-span-full flex justify-center gap-24 flex-wrap">
                  {prevcoreTeam.map((member, index) => (
                    <ProfileCard key={index} {...member} />
                  ))}
                </div>
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