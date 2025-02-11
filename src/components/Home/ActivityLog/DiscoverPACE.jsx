import React from 'react';

const DiscoverPACE = () => {
  return (
    <div style={{ textAlign: 'center', fontFamily: 'Arial, sans-serif', marginTop: '60px' }}>
      <h1 
        style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          color: 'black',
          animation: 'float 3s ease-in-out infinite' 
        }}
      >
        Discover{' '}
        <span 
          style={{ 
            color: 'red', 
            textShadow: '0 0 10px rgba(255, 0, 0, 0.5)', 
            animation: 'shine 2s infinite' 
          }}
        >
          PACE
        </span>
      </h1>

      {/* Meaningful sentence below */}
      <p style={{ fontSize: '1.5rem', color: 'black', marginTop: '10px' }}>
        A community-driven initiative shaping the future of civil engineering.
      </p>

      <style>
        {`
          @keyframes shine {
            0% { text-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 0 30px rgba(255, 0, 0, 0.4); }
            50% { text-shadow: 0 0 40px rgba(255, 0, 0, 1), 0 0 50px rgba(255, 0, 0, 0.6); }
            100% { text-shadow: 0 0 20px rgba(255, 0, 0, 0.5), 0 0 30px rgba(255, 0, 0, 0.4); }
          }

          @keyframes float {
            0% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
};

export default DiscoverPACE;
