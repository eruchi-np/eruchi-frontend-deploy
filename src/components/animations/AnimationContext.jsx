import { createContext, useRef } from 'react';

const DEFAULT_CONFIG = {
  direction: 'vertical',
  distance: 40,
  duration: 0.5,
  ease: 'power3.out',
  delay: 0,
  reverse: false,
  skip: false,
};

export const AnimationContext = createContext(null);

export function AnimationProvider({ children }) {
  const configRef = useRef({ ...DEFAULT_CONFIG });

  function setOverride(cfg) {
    configRef.current = { ...DEFAULT_CONFIG, ...cfg };
  }

  function clearOverride() {
    configRef.current = { ...DEFAULT_CONFIG };
  }

  return (
    <AnimationContext.Provider value={{ configRef, setOverride, clearOverride }}>
      {children}
    </AnimationContext.Provider>
  );
}