import { useState, useEffect } from 'react';

const DEFAULTS = {
  variant: 'aurora',
  glowMode: 'tone',
  glowIntensity: 1.7,
  cardRadius: 21,
  ambientIntensity: 1,
  fontFamily: 'geist'
};

export function useTweaks(defaults = DEFAULTS) {
  const [tweaks, setTweaks] = useState(() => {
    try {
      const stored = localStorage.getItem('plex.tweaks');
      return stored ? { ...defaults, ...JSON.parse(stored) } : defaults;
    } catch {
      return defaults;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('plex.tweaks', JSON.stringify(tweaks));
    } catch (error) {
      console.error('Failed to save tweaks:', error);
    }
  }, [tweaks]);

  const setTweak = (key, value) => {
    setTweaks(prev => ({ ...prev, [key]: value }));
  };

  return [tweaks, setTweak];
}
