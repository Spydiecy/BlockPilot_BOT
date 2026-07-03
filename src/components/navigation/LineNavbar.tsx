'use client';

import { useEffect, useState } from 'react';

export function LineNavbar() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Handle scroll events to make the navbar sticky
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
      // Show the navbar when scrolling down
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navbarStyle = {
    position: 'fixed' as const,
    bottom: '40px',
    left: '50%',
    width: '65%',
    maxWidth: '650px',
    height: '5px',
    background: 'linear-gradient(90deg, rgba(0,0,0,0), #4a4a4a, #6b6b6b, #8a8a8a, #a8a8a8, #c5c5c5, #a8a8a8, #8a8a8a, #6b6b6b, #4a4a4a, rgba(0,0,0,0))',
    backgroundSize: '300% 100%',
    animation: 'flow 8s ease-in-out infinite, pulse 4s ease-in-out infinite',
    transform: isVisible ? 'translate(-50%, 0)' : 'translate(-50%, 100%)',
    transition: 'transform 0.3s ease-in-out, opacity 0.2s ease-in-out',
    zIndex: 50,
    opacity: isHovered ? 1 : 0.7,
    borderRadius: '2px',
  };

  return (
    <div 
      className="line-navbar"
      style={navbarStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <style jsx global>{`
        @keyframes flow {
          0% {
            background-position: 100% 50%;
            opacity: 0.7;
          }
          50% {
            background-position: 0% 50%;
            opacity: 0.9;
          }
          100% {
            background-position: 100% 50%;
            opacity: 0.7;
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 3px rgba(200, 200, 200, 0.2);
          }
          50% {
            box-shadow: 0 0 12px rgba(200, 200, 200, 0.5);
          }
        }
        
        .line-navbar {
          will-change: transform, opacity, box-shadow;
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), 
                     opacity 0.2s ease-in-out, 
                     box-shadow 0.3s ease-in-out;
          border-radius: 2px;
          backdrop-filter: blur(2px);
        }
      `}</style>
    </div>
  );
}
