import React, { useEffect, useRef } from 'react';
import { WeatherOverlayType } from '../types';

interface WeatherOverlayProps {
  activeOverlay: WeatherOverlayType; // 'auto' | 'clear' | 'cloudy' | 'fog' | 'rain' | 'thunderstorm'
  liveCategory?: 'clear' | 'cloudy' | 'fog' | 'rain' | 'thunderstorm';
}

export const WeatherOverlay: React.FC<WeatherOverlayProps> = ({ activeOverlay, liveCategory = 'clear' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Determine effective overlay category
  const effectiveCategory = activeOverlay === 'none' ? 'none' : (activeOverlay === 'auto' ? liveCategory : activeOverlay);

  // Rain Canvas Animation Effect
  useEffect(() => {
    if (effectiveCategory !== 'rain' && effectiveCategory !== 'thunderstorm') {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Generate raindrops
    const dropCount = effectiveCategory === 'thunderstorm' ? 180 : 100;
    const drops = Array.from({ length: dropCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: Math.random() * 20 + 10,
      speed: Math.random() * 12 + 10,
      opacity: Math.random() * 0.4 + 0.3,
      wind: Math.random() * 3 + 2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      for (let i = 0; i < drops.length; i++) {
        const drop = drops[i];

        ctx.strokeStyle = `rgba(180, 220, 255, ${drop.opacity})`;
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x + drop.wind, drop.y + drop.length);
        ctx.stroke();

        drop.y += drop.speed;
        drop.x += drop.wind;

        if (drop.y > height) {
          drop.y = -drop.length;
          drop.x = Math.random() * width;
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [effectiveCategory]);

  if (effectiveCategory === 'none') {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden select-none">
      {/* ☀️ SUNNY / CLEAR SUN GLARE EFFECT */}
      {effectiveCategory === 'clear' && (
        <div className="absolute inset-0">
          <div className="absolute -top-12 right-12 w-96 h-96 rounded-full bg-gradient-to-br from-amber-300/30 via-yellow-400/10 to-transparent blur-3xl animate-pulse" />
          <div className="absolute top-1/4 right-1/3 w-64 h-64 rounded-full bg-amber-200/15 blur-2xl pointer-events-none" />
          {/* Sun Ray Lens Flares */}
          <div className="absolute top-0 right-20 w-80 h-[500px] bg-gradient-to-b from-amber-200/20 via-amber-100/5 to-transparent rotate-12 blur-lg pointer-events-none" />
        </div>
      )}

      {/* ☁️ CLOUDY / OVERCAST SHADOW OVERLAY */}
      {(effectiveCategory === 'cloudy' || effectiveCategory === 'rain' || effectiveCategory === 'thunderstorm') && (
        <div className="absolute inset-0">
          {/* Soft drifting cloud shadows */}
          <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply transition-opacity duration-1000" />
          <div className="absolute -top-20 -left-20 w-[120%] h-64 bg-gradient-to-b from-slate-600/20 via-slate-500/10 to-transparent blur-2xl animate-[drift_25s_infinite_linear]" />
        </div>
      )}

      {/* 🌫️ FOG / SEA MIST EFFECT OVERLAY */}
      {effectiveCategory === 'fog' && (
        <div className="absolute inset-0">
          {/* Coastal fog mist layers */}
          <div className="absolute inset-0 bg-slate-100/25 backdrop-contrast-90 mix-blend-screen transition-all duration-700" />
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-slate-200/20 to-transparent blur-xl" />
          {/* Drifting mist clouds */}
          <div className="absolute inset-0 opacity-60 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.6),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(240,245,250,0.5),transparent_60%)] animate-pulse" />
        </div>
      )}

      {/* 🌧️ CANVASES FOR RAIN & THUNDERSTORM DROPS */}
      {(effectiveCategory === 'rain' || effectiveCategory === 'thunderstorm') && (
        <>
          <div className="absolute inset-0 bg-blue-950/20 mix-blend-multiply backdrop-brightness-95" />
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />
        </>
      )}

      {/* 🌩️ THUNDERSTORM LIGHTNING FLASH */}
      {effectiveCategory === 'thunderstorm' && (
        <div className="absolute inset-0 bg-white/30 mix-blend-overlay animate-[lightning_6s_infinite_ease-in-out] pointer-events-none" />
      )}
    </div>
  );
};
