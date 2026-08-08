"use client";

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useTheme } from '@/contexts/ThemeContext';

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
  loading: () => <div className="h-full w-full" style={{ backgroundColor: 'var(--theme-surface)' }} />,
});

function HeroSplineBackground({ isLightTheme }: { isLightTheme: boolean }) {
  useEffect(() => {
    // Hide Spline watermark/logo with multiple approaches
    const hideWatermark = () => {
      // Method 1: CSS injection
      const style = document.createElement('style');
      style.textContent = `
        #spline-watermark,
        [id*="watermark"],
        a[href*="spline.design"],
        a[href*="spline"],
        div[style*="spline"],
        .spline-watermark {
          display: none !important;
          opacity: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
          width: 0 !important;
          height: 0 !important;
          position: absolute !important;
          left: -9999px !important;
        }
        /* Target the specific watermark container */
        canvas + div,
        canvas ~ div:last-child {
          display: none !important;
        }
      `;
      style.id = 'hide-spline-logo';
      if (!document.getElementById('hide-spline-logo')) {
        document.head.appendChild(style);
      }

      // Method 2: Direct DOM manipulation
      const removeWatermarks = () => {
        const watermarkSelectors = [
          'a[href*="spline.design"]',
          'a[href*="spline"]',
          '[id*="watermark"]',
          '#spline-watermark'
        ];
        
        watermarkSelectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          elements.forEach(el => {
            if (el instanceof HTMLElement) {
              el.style.display = 'none';
              el.style.visibility = 'hidden';
              el.style.opacity = '0';
              el.remove();
            }
          });
        });
      };

      // Run immediately and on intervals
      removeWatermarks();
      const interval = setInterval(removeWatermarks, 500);
      
      return () => clearInterval(interval);
    };

    const cleanup = hideWatermark();
    
    return () => {
      if (cleanup) cleanup();
      const existingStyle = document.getElementById('hide-spline-logo');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        pointerEvents: 'auto',
        overflow: 'hidden',
      }}
    >
      <Spline
        style={{
          width: '100%',
          height: '100vh',
          pointerEvents: 'auto',
        }}
        scene="https://prod.spline.design/dJqTIQ-tE3ULUPMi/scene.splinecode"
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100vh',
          background: isLightTheme 
            ? 'linear-gradient(180deg, rgba(248, 251, 255, 0.7) 0%, rgba(219, 234, 254, 0.8) 60%, rgba(239, 246, 255, 0.7) 100%)'
            : 'var(--hero-overlay-gradient)',
          pointerEvents: 'none',
        }}
      />
      {isLightTheme && (
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.08] mix-blend-multiply pointer-events-none" />
      )}
    </div>
  );
}

function ScreenshotSection({
  screenshotRef,
  isLightTheme,
}: {
  screenshotRef: React.MutableRefObject<HTMLDivElement | null>;
  isLightTheme: boolean;
}) {
  return (
    <section className="relative z-10 container mx-auto px-4 md:px-6 lg:px-8 -mb-48 mt-24">
      <div
        ref={screenshotRef}
        className={`rounded-xl overflow-hidden shadow-2xl border w-full md:w-[80%] lg:w-[70%] mx-auto ${
          isLightTheme
            ? 'bg-white/80 border-blue-200/80 shadow-blue-500/15'
            : 'bg-gray-900 border-gray-700/50'
        }`}
      >
        <div className="relative">
          <Image
            src="/screenshot.jpg"
            alt="App Screenshot"
            width={1400}
            height={617}
            className="w-full h-auto block rounded-lg mx-auto"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          />
        </div>
      </div>
    </section>
  );
}

function HeroContent({ isLightTheme }: { isLightTheme: boolean }) {
  return (
    <div
      className={`px-4 max-w-screen-xl mx-auto w-full flex flex-col lg:flex-row justify-between items-start lg:items-center py-16 ${
        isLightTheme ? 'text-slate-950' : 'text-white'
      }`}
    >
      <div className="w-full lg:w-1/2 pr-0 lg:pr-8 mb-8 lg:mb-0">
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Build & Audit<br />Smart Contracts<br/>with BlockPilot
        </h1>
        <div className="text-xs text-gray-400 tracking-wider mb-6">
            AI-POWERED BUILDER · SECURITY AUDITS · IPFS STORAGE
          </div>
      </div>

      <div className="w-full lg:w-1/2 pl-0 lg:pl-8 flex flex-col items-start">
         <p className={`text-xl sm:text-2xl mb-8 max-w-xl leading-relaxed ${isLightTheme ? 'text-slate-700' : 'text-gray-300'}`}>
           Create secure smart contracts with our AI builder, get instant security audits, and store reports permanently on IPFS
        </p>
        <div className="flex pointer-events-auto flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-4">
            <a
              href="/audit"
              className={`font-medium py-3 px-8 rounded-full transition duration-300 flex items-center justify-center w-full sm:w-auto text-sm ${
                isLightTheme
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30'
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
               <span className="text-cyan-500 mr-2 text-lg font-bold">+</span>
               Get Started
            </a>
            <a
              href="https://x.com/bloc_pilot"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium py-3 px-8 rounded-full transition duration-300 w-full sm:w-auto flex items-center justify-center text-sm ${
                isLightTheme
                  ? 'bg-white border border-blue-200 text-slate-900 hover:bg-blue-50 shadow-sm shadow-blue-300/30'
                  : 'bg-black border border-gray-800 text-white hover:bg-gray-900'
              }`}
            >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Follow Us
            </a>
        </div>
      </div>
    </div>
  );
}



const HeroSection = () => {
  const { theme, isHydrated } = useTheme();
  const isLightTheme = !isHydrated || theme === 'light';
  const screenshotRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (screenshotRef.current && heroContentRef.current) {
        requestAnimationFrame(() => {
          const scrollPosition = window.pageYOffset;

          if (screenshotRef.current) {
            screenshotRef.current.style.transform = `translateY(-${scrollPosition * 0.5}px)`;
          }

          const maxScroll = 400;
          const opacity = 1 - Math.min(scrollPosition / maxScroll, 1);
          if (heroContentRef.current) {
             heroContentRef.current.style.opacity = opacity.toString();
          }
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative">
      <div className="relative min-h-screen">
        <div className="absolute inset-0 z-0 pointer-events-auto">
          <HeroSplineBackground isLightTheme={isLightTheme} />
        </div>

        <div ref={heroContentRef} style={{
          position: 'absolute', top: 0, left: 0, width: '100%', height: '100vh',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10, pointerEvents: 'none'
        }}>
          <HeroContent isLightTheme={isLightTheme} />
        </div>
      </div>

      <div className="relative z-10" style={{ marginTop: '-15vh' }}>
        <ScreenshotSection screenshotRef={screenshotRef} isLightTheme={isLightTheme} />
      </div>
    </div>
  );
};

export { HeroSection }
