import { useRef } from 'react';

const SpotlightCard = ({ children, className = '', spotlightColor = 'rgba(255, 255, 255, 0.25)', style = {} }) => {
  const divRef = useRef(null);

  const handleMouseMove = e => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    divRef.current.style.setProperty('--mouse-x', `${x}px`);
    divRef.current.style.setProperty('--mouse-y', `${y}px`);
    divRef.current.style.setProperty('--spotlight-color', spotlightColor);
  };

  return (
    <>
      {/* Self-contained Runtime Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .card-spotlight {
          position: relative;
          overflow: hidden;
          --mouse-x: 50%;
          --mouse-y: 50%;
          --spotlight-color: rgba(255, 255, 255, 0.05);
        }

        .card-spotlight::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), var(--spotlight-color), transparent 80%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
          z-index: 0;
        }

        .card-spotlight:hover::before,
        .card-spotlight:focus-within::before {
          opacity: 0.6;
        }

        /* Ensure card contents stack above the spotlight layer background */
        .card-spotlight > * {
          position: relative;
          z-index: 1;
        }
      `}} />

      <div 
        ref={divRef} 
        onMouseMove={handleMouseMove} 
        className={`card-spotlight ${className}`}
        style={style}
      >
        {children}
      </div>
    </>
  );
};

export default SpotlightCard;