import React, { useEffect, useState, useRef } from 'react';
import { TourConfig, LocationItem } from '../types';
import { Play, Pause, SkipForward, SkipBack, X, Volume2, MapPin } from 'lucide-react';

interface TourPlayerBarProps {
  tourConfig: TourConfig;
  locations: LocationItem[];
  activeStepIdx: number;
  onStepChange: (idx: number) => void;
  onClose: () => void;
  onSelectLocation: (loc: LocationItem) => void;
  defaultVoiceStyle?: string;
  defaultSpeechRate?: number;
}

export const TourPlayerBar: React.FC<TourPlayerBarProps> = ({ 
  tourConfig, 
  locations, 
  activeStepIdx, 
  onStepChange, 
  onClose,
  onSelectLocation,
  defaultVoiceStyle,
  defaultSpeechRate
}) => {
  const [isPlaying, setIsPlaying] = useState(true); // Autoplay by default
  const synthRef = useRef(window.speechSynthesis);
  
  const currentStep = tourConfig.steps[activeStepIdx];
  const currentLocation = locations.find(l => l.id === currentStep?.locationId);

  useEffect(() => {
    let isCancelled = false;

    if (isPlaying && currentStep?.narrationScript) {
      // Use dynamic globalAudioNarrator for TTS API integration
      import('../utils/speechUtils').then(({ globalAudioNarrator }) => {
        if (isCancelled) return;
        globalAudioNarrator.speak({
          id: `tour-${currentStep.locationId}`,
          text: currentStep.narrationScript,
          voiceStyle: defaultVoiceStyle,
          speechRate: defaultSpeechRate,
          onEnd: () => {
            if (isCancelled) return;
            if (activeStepIdx < tourConfig.steps.length - 1) {
              onStepChange(activeStepIdx + 1);
            } else {
              setIsPlaying(false);
            }
          }
        });
      });
    } else {
      import('../utils/speechUtils').then(({ globalAudioNarrator }) => {
        globalAudioNarrator.stop();
      });
    }
    
    if (currentLocation) {
        onSelectLocation(currentLocation);
    }
    
    return () => {
      isCancelled = true;
      import('../utils/speechUtils').then(({ globalAudioNarrator }) => {
        globalAudioNarrator.stop();
      });
    }
  }, [activeStepIdx, isPlaying, currentStep, currentLocation, tourConfig.steps.length, onStepChange, onSelectLocation]);

  if (!tourConfig || tourConfig.steps.length === 0) return null;

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-fadeIn">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] border border-white/50 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1A365D] flex items-center justify-center text-[#C5A059] shadow-inner">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {tourConfig.title} • Bước {activeStepIdx + 1}/{tourConfig.steps.length}
              </p>
              <h3 className="font-serif font-bold text-[#1A365D] text-lg leading-tight">
                {currentLocation?.title || 'Đang tải...'}
              </h3>
            </div>
          </div>
          <button 
            onClick={() => {
              setIsPlaying(false);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onStepChange(Math.max(0, activeStepIdx - 1))}
              disabled={activeStepIdx === 0}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 disabled:opacity-30 transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-[#C5A059] hover:bg-[#B38E47] flex items-center justify-center text-white shadow-md hover:scale-105 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
            </button>
            <button 
              onClick={() => onStepChange(Math.min(tourConfig.steps.length - 1, activeStepIdx + 1))}
              disabled={activeStepIdx === tourConfig.steps.length - 1}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-700 disabled:opacity-30 transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#1A365D] transition-all duration-500 ease-out"
              style={{ width: `${((activeStepIdx + 1) / tourConfig.steps.length) * 100}%` }}
            />
          </div>
          
          <div className={`p-2 rounded-full ${isPlaying ? 'text-[#C5A059] bg-amber-50 animate-pulse' : 'text-gray-400'}`}>
            <Volume2 className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
};
