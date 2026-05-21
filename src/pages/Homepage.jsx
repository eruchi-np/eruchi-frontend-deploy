import React from 'react';
import Grainient from '../components/homepage/Grainient';

export default function Homepage() {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Grainient
        color1="#ffffff"
        color2="#ffffff"
        color3="#3399FF"
        timeSpeed={0.25}
        colorBalance={0.0}
        warpStrength={1.0}
        warpFrequency={5.0}
        warpSpeed={2.0}
        warpAmplitude={50.0}
        blendAngle={0.0}
        blendSoftness={0.05}
        rotationAmount={500.0}
        noiseScale={2.0}
        grainAmount={0}
        grainScale={1.2}
        grainAnimated={false}
        contrast={1.5}
        gamma={1.0}
        saturation={1.0}
        centerX={0.0}
        centerY={0.0}
        zoom={0.9}
      />
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <div style={{
          textAlign: 'center',
          color: '#0000000',
          textShadow: '0 2px 40px rgba(0,0,0,0.25)',
        }}>
          
          <h1 style={{
            fontSize: 'clamp(4rem, 10vw, 9rem)',
            fontWeight: 300,
            margin: 0,
            fontFamily: 'ProdigySans, sans-serif',
            letterSpacing: '-0.04em',
            lineHeight: 1,
          }}>
            BIG CHANGES
          </h1>

          <p style={{
            fontSize: 'clamp(1rem, 2vw, 1.5rem)',
            fontWeight: 400,
            marginTop: '1rem',
            letterSpacing: '0.4em',
            opacity: 0.8,
            fontFamily: 'ProdigySans, sans-serif',
          }}>
            COMING SOON
          </p>

        </div>
      </div>
    </div>
  );
}