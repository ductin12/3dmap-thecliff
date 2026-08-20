import React, { useEffect, useRef } from 'react';

interface AmbientAudioProps {
  isPlaying: boolean;
  customMusicUrl?: string;
}

export const AmbientAudio: React.FC<AmbientAudioProps> = ({ isPlaying, customMusicUrl }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const noiseNodeRef = useRef<AudioNode | null>(null);
  const musicAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // If custom music URL is provided, play audio element
    if (customMusicUrl && customMusicUrl.trim() !== '') {
      // Stop synthetic waves if playing
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }

      if (!musicAudioRef.current) {
        const audio = new Audio(customMusicUrl);
        audio.loop = true;
        audio.volume = 0.4;
        musicAudioRef.current = audio;
      } else if (musicAudioRef.current.src !== customMusicUrl) {
        musicAudioRef.current.pause();
        const audio = new Audio(customMusicUrl);
        audio.loop = true;
        audio.volume = 0.4;
        musicAudioRef.current = audio;
      }

      if (isPlaying) {
        musicAudioRef.current.play().catch((err) => {
          console.warn("Custom ambient music autoplay blocked or failed:", err);
        });
      } else {
        musicAudioRef.current.pause();
      }

      return;
    }

    // Stop custom audio if switching back to synthetic waves
    if (musicAudioRef.current) {
      musicAudioRef.current.pause();
      musicAudioRef.current = null;
    }

    // Default: Synthesized Ocean Wave Sound
    if (isPlaying) {
      try {
        if (!audioCtxRef.current) {
          const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioContextClass) {
            audioCtxRef.current = new AudioContextClass();
          }
        }

        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume();
        }

        if (audioCtxRef.current && !noiseNodeRef.current) {
          const ctx = audioCtxRef.current;

          // Create pink/brown noise for ocean waves sound
          const bufferSize = ctx.sampleRate * 2;
          const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
          const output = noiseBuffer.getChannelData(0);
          
          let lastOut = 0.0;
          for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            output[i] = (lastOut + (0.02 * white)) / 1.02; // Brown noise formula
            lastOut = output[i];
            output[i] *= 3.5; // Gain boost
          }

          const whiteNoise = ctx.createBufferSource();
          whiteNoise.buffer = noiseBuffer;
          whiteNoise.loop = true;

          // Lowpass filter for deep ocean rumble
          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(400, ctx.currentTime);

          // Wave LFO modulation (simulate rolling waves every 6-8 seconds)
          const lfo = ctx.createOscillator();
          lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 0.12Hz = ~8 sec wave period

          const lfoGain = ctx.createGain();
          lfoGain.gain.setValueAtTime(250, ctx.currentTime);

          lfo.connect(lfoGain);
          lfoGain.connect(filter.frequency);

          const mainGain = ctx.createGain();
          mainGain.gain.setValueAtTime(0.08, ctx.currentTime);

          whiteNoise.connect(filter);
          filter.connect(mainGain);
          mainGain.connect(ctx.destination);

          whiteNoise.start();
          lfo.start();

          noiseNodeRef.current = whiteNoise;
          gainNodeRef.current = mainGain;
        } else if (gainNodeRef.current && audioCtxRef.current) {
          gainNodeRef.current.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
        }
      } catch (err) {
        console.warn("Web Audio ambient wave sound initialization notice:", err);
      }
    } else {
      if (gainNodeRef.current && audioCtxRef.current) {
        gainNodeRef.current.gain.setValueAtTime(0, audioCtxRef.current.currentTime);
      }
    }
  }, [isPlaying, customMusicUrl]);

  return null;
};
