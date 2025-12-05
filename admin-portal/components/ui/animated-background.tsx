'use client';

import { useEffect, useMemo, useState } from 'react';
import Particles, { initParticlesEngine } from '@tsparticles/react';
import { type Container, type ISourceOptions } from '@tsparticles/engine';
import { loadFull } from "tsparticles"; 

export const AnimatedBackground = () => {
  const [init, setInit] = useState(false);
  const [bgColor, setBgColor] = useState('#0F172A'); // Default dark color

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadFull(engine);
    }).then(() => {
      setInit(true);
    });

    // Get the computed background color from CSS variable
    const computedStyle = getComputedStyle(document.documentElement);
    const cssBgColor = computedStyle.getPropertyValue('--background').trim();
    // Convert HSL (e.g., "0 0% 100%") to a format tsparticles can use.
    // tsparticles supports HSL directly, so we can reformat it to 'hsl(H, S%, L%)'
    if (cssBgColor) {
      const parts = cssBgColor.split(' ');
      if (parts.length === 3) {
        setBgColor(`hsl(${parts[0]}, ${parts[1]}%, ${parts[2]}%)`);
      } else {
        setBgColor(cssBgColor); // Fallback if not HSL
      }
    }

  }, []);

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log('Particles container loaded', container);
  };

  const options: ISourceOptions = useMemo(
    () => ({
      autoPlay: true,
      background: {
        color: {
          value: bgColor, 
        },
        opacity: 1,
      },
      fullScreen: {
        enable: true,
        zIndex: -1,
      },
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'parallax',
          },
        },
        modes: {
          parallax: {
            enable: true,
            force: 60,
            smooth: 10,
          },
        },
      },
      particles: {
        number: {
          value: 80,
          density: {
            enable: true,
          },
        },
        color: {
          value: '#ffffff',
        },
        shape: {
          type: 'circle',
        },
        opacity: {
          value: { min: 0.1, max: 0.5 },
          animation: {
            enable: true,
            speed: 1,
            sync: false,
          },
        },
        size: {
          value: { min: 1, max: 5 },
          animation: {
            enable: true,
            speed: 2,
            sync: false,
          },
        },
        move: {
          enable: true,
          speed: 0.5,
          direction: 'none',
          straight: false,
        },
      },
      detectRetina: true,
    }),
    [],
  );

  if (init) {
    return (
      <Particles
        id="tsparticles"
        particlesLoaded={particlesLoaded}
        options={options}
      />
    );
  }

  return null;
};
