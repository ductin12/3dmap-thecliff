import React, { useState, useRef, useEffect, useCallback } from 'react';
import { LocationItem, LightingMode, MapTransform, WeatherOverlayType, TourConfig } from '../types';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Compass, MapPin, Video, CloudSun, CloudOff } from 'lucide-react';
import { WeatherOverlay } from './WeatherOverlay';

interface ResortMapProps {
  locations: LocationItem[];
  mapImageBg?: string;
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  hoveredLocation: LocationItem | null;
  onHoverLocation: (loc: LocationItem | null) => void;
  is3DTilted: boolean;
  lightingMode: LightingMode;
  searchQuery: string;
  isCalibratingPin: boolean;
  calibratingLocationId: string | null;
  onUpdatePinPosition: (id: string, x: number, y: number) => void;
  activeWeatherOverlay?: WeatherOverlayType;
  liveWeatherCategory?: 'clear' | 'cloudy' | 'fog' | 'rain' | 'thunderstorm';
  onToggleWeatherEffect?: () => void;
  isTourMode?: boolean;
  tourConfig?: TourConfig;
  activeTourStepIdx?: number;
}

export const ResortMap: React.FC<ResortMapProps> = ({
  locations,
  mapImageBg = '/cliff-map.svg',
  selectedLocation,
  onSelectLocation,
  hoveredLocation,
  onHoverLocation,
  is3DTilted,
  lightingMode,
  searchQuery,
  isCalibratingPin,
  calibratingLocationId,
  onUpdatePinPosition,
  activeWeatherOverlay = 'auto',
  liveWeatherCategory = 'clear',
  onToggleWeatherEffect,
  isTourMode = false,
  tourConfig,
  activeTourStepIdx = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  // Map background image state with fallback
  const [imgSrc, setImgSrc] = useState<string>(mapImageBg || '/cliff-map.svg');

  useEffect(() => {
    setImgSrc(mapImageBg || '/cliff-map.svg');
  }, [mapImageBg]);

  // Map transform state for zoom and pan
  const [transform, setTransform] = useState<MapTransform>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    rotateX: is3DTilted ? 32 : 0,
    rotateY: is3DTilted ? -6 : 0,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Pinch-to-zoom states for mobile
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialPinchScale, setInitialPinchScale] = useState<number>(1);

  // Sync 3D state
  useEffect(() => {
    setTransform(prev => ({
      ...prev,
      rotateX: is3DTilted ? 32 : 0,
      rotateY: is3DTilted ? -6 : 0,
    }));
  }, [is3DTilted]);

  // Center camera on selected pin when selected
  useEffect(() => {
    if (selectedLocation && containerRef.current) {
      // Calculate target translate offset to put pin in center
      const targetX = (50 - selectedLocation.x) * 8;
      const targetY = (50 - selectedLocation.y) * 8;
      setTransform(prev => ({
        ...prev,
        scale: Math.max(prev.scale, 1.3),
        translateX: targetX,
        translateY: targetY,
      }));
    }
  }, [selectedLocation]);

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setTransform(prev => {
      const newScale = Math.min(Math.max(prev.scale * zoomFactor, 0.7), 3.5);
      return { ...prev, scale: newScale };
    });
  };

  // Drag pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.translateX, y: e.clientY - transform.translateY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTransform(prev => ({
      ...prev,
      translateX: e.clientX - dragStart.x,
      translateY: e.clientY - dragStart.y,
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile pan and pinch zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - transform.translateX,
        y: e.touches[0].clientY - transform.translateY,
      });
    } else if (e.touches.length === 2) {
      setIsDragging(false); // Stop dragging when pinching
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setInitialPinchDistance(dist);
      setInitialPinchScale(transform.scale);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // Prevent default scroll behavior on touch move
    // if it's on the map
    if (e.touches.length === 1 && isDragging) {
      setTransform(prev => ({
        ...prev,
        translateX: e.touches[0].clientX - dragStart.x,
        translateY: e.touches[0].clientY - dragStart.y,
      }));
    } else if (e.touches.length === 2 && initialPinchDistance !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const newScale = Math.min(Math.max(initialPinchScale * (dist / initialPinchDistance), 0.7), 3.5);
      setTransform(prev => ({ ...prev, scale: newScale }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) {
      setInitialPinchDistance(null);
    }
    if (e.touches.length === 0) {
      setIsDragging(false);
    }
  };

  // Click on map image in Calibrator Mode
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCalibratingPin || !calibratingLocationId || !mapWrapperRef.current) return;
    
    const rect = mapWrapperRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = Math.round((clickX / rect.width) * 1000) / 10;
    const percentY = Math.round((clickY / rect.height) * 1000) / 10;

    if (percentX >= 0 && percentX <= 100 && percentY >= 0 && percentY <= 100) {
      onUpdatePinPosition(calibratingLocationId, percentX, percentY);
    }
  };

  // Reset view
  const resetView = () => {
    setTransform({
      scale: 1,
      translateX: 0,
      translateY: 0,
      rotateX: is3DTilted ? 32 : 0,
      rotateY: is3DTilted ? -6 : 0,
    });
  };

  // Check if a pin matches current search query
  const matchesSearch = (loc: LocationItem) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      loc.title.toLowerCase().includes(q) ||
      loc.subtitle.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.description.toLowerCase().includes(q)
    );
  };

  // Lighting overlay styles
  const getLightingOverlayStyle = () => {
    if (lightingMode === 'sunset') {
      return 'bg-gradient-to-tr from-amber-900/40 via-orange-950/20 to-pink-900/30 backdrop-hue-rotate-15 mix-blend-color-burn';
    }
    if (lightingMode === 'night') {
      return 'bg-gradient-to-b from-slate-950/70 via-indigo-950/60 to-slate-950/80 backdrop-contrast-125 mix-blend-multiply';
    }
    return 'bg-gradient-to-tr from-cyan-500/5 via-transparent to-amber-400/5';
  };

  return (
    <div 
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      className={`relative w-full h-full overflow-hidden bg-[#EEF2F7] select-none cursor-grab active:cursor-grabbing p-4 md:p-8 flex items-center justify-center ${
        isCalibratingPin ? 'cursor-crosshair ring-4 ring-[#C5A059]' : ''
      }`}
      style={{ perspective: '1000px', touchAction: 'none' }}
    >
      {/* Dynamic Weather Overlay (Rain, Fog, Clouds, Sun Glare) */}
      <WeatherOverlay activeOverlay={activeWeatherOverlay} liveCategory={liveWeatherCategory} />

      {/* Sun Glare / Night Glow Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
        {lightingMode === 'day' && (
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-200/20 blur-3xl" />
        )}
        {lightingMode === 'sunset' && (
          <div className="absolute -top-32 right-10 w-full h-64 bg-gradient-to-b from-orange-400/20 to-transparent blur-2xl" />
        )}
        {lightingMode === 'night' && (
          <div className="absolute inset-0 bg-slate-900/40 pointer-events-none" />
        )}
      </div>

      {/* Floating Controls Bar */}
      <div className="absolute bottom-8 left-8 z-20 flex gap-2">
        <button
          onClick={() => setTransform(p => ({ ...p, scale: Math.min(p.scale * 1.25, 3.5) }))}
          className="w-11 h-11 bg-white hover:bg-gray-50 text-[#1A365D] rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-xl font-bold transition-transform hover:scale-105"
          title="Phóng to map"
        >
          <ZoomIn className="w-5 h-5 text-[#1A365D]" />
        </button>
        <button
          onClick={() => setTransform(p => ({ ...p, scale: Math.max(p.scale * 0.8, 0.7) }))}
          className="w-11 h-11 bg-white hover:bg-gray-50 text-[#1A365D] rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-xl font-bold transition-transform hover:scale-105"
          title="Thu nhỏ map"
        >
          <ZoomOut className="w-5 h-5 text-[#1A365D]" />
        </button>
        <button
          onClick={resetView}
          className="w-11 h-11 bg-white hover:bg-gray-50 text-[#C5A059] rounded-full shadow-lg border border-gray-100 flex items-center justify-center text-xl transition-transform hover:scale-105"
          title="Đặt lại góc nhìn chuẩn"
        >
          <RotateCcw className="w-5 h-5 text-[#C5A059]" />
        </button>
        {onToggleWeatherEffect && (
          <button
            onClick={onToggleWeatherEffect}
            className={`w-11 h-11 rounded-full shadow-lg border flex items-center justify-center transition-all hover:scale-105 ${
              activeWeatherOverlay === 'none'
                ? 'bg-white hover:bg-gray-50 text-gray-400 border-gray-200'
                : 'bg-[#1A365D] hover:bg-[#2A4365] text-[#C5A059] border-[#1A365D]'
            }`}
            title={activeWeatherOverlay === 'none' ? "Bật hiệu ứng thời tiết (Mưa/Nắng/Mây/Sương)" : "Tắt hiệu ứng thời tiết (Bản đồ trong suốt)"}
          >
            {activeWeatherOverlay === 'none' ? (
              <CloudOff className="w-5 h-5 text-gray-400" />
            ) : (
              <CloudSun className="w-5 h-5 text-[#C5A059]" />
            )}
          </button>
        )}
      </div>

      {/* Calibrator Banner */}
      {isCalibratingPin && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-[#C5A059] text-white font-bold px-6 py-2.5 rounded-full shadow-2xl flex items-center gap-2 animate-bounce text-xs md:text-sm">
          <MapPin className="w-5 h-5" />
          <span>Đang hiệu chỉnh vị trí ghim! Nhấp vào bản đồ để đặt tọa độ X%, Y%.</span>
        </div>
      )}

      {/* 3D Map Transform Canvas Wrapper */}
      <div
        className="w-full h-full flex items-center justify-center transition-transform duration-300 ease-out"
        style={{
          transform: `translate3d(${transform.translateX}px, ${transform.translateY}px, 0px) scale(${transform.scale}) rotateX(${transform.rotateX}deg) rotateY(${transform.rotateY}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Main Map Frame with Sleek Luxury White Border & Shadow */}
        <div 
          ref={mapWrapperRef}
          onClick={handleMapClick}
          className="relative w-[1000px] h-[1333px] min-w-[1000px] min-h-[1333px] shrink-0 max-w-none shadow-2xl rounded-[36px] border-[12px] border-white overflow-hidden bg-[#D6E4F0]"
          style={{
            backgroundImage: `url('${imgSrc}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Real Resort Map Graphic Render */}
          <img
            src={imgSrc}
            alt="The Cliff Resort & Residences 3D Map"
            className="w-full h-full object-cover pointer-events-none transition-all duration-700"
            referrerPolicy="no-referrer"
            onError={() => {
              console.warn("Map background image failed to load, falling back to /cliff-map.svg");
              setImgSrc('/cliff-map.svg');
            }}
          />

          {/* Interactive Vector Terrain Art Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A365D]/20 via-transparent to-transparent pointer-events-none" />

          {/* Lighting Mode Color Filter Overlay */}
          <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${getLightingOverlayStyle()}`} />
          
          {/* Tour Route Layer */}
          {isTourMode && tourConfig && tourConfig.steps.length > 1 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" preserveAspectRatio="none">
              <defs>
                <filter id="glowLine" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="2" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              {tourConfig.steps.map((step, idx) => {
                if (idx === 0) return null;
                const prevStep = tourConfig.steps[idx - 1];
                const loc1 = locations.find(l => l.id === prevStep.locationId);
                const loc2 = locations.find(l => l.id === step.locationId);
                if (!loc1 || !loc2) return null;
                
                const isActive = idx === activeTourStepIdx;
                
                return (
                  <line
                    key={`route-${idx}`}
                    x1={`${loc1.x}%`}
                    y1={`${loc1.y}%`}
                    x2={`${loc2.x}%`}
                    y2={`${loc2.y}%`}
                    stroke={isActive ? "#1A365D" : "#C5A059"}
                    strokeWidth={isActive ? "4" : "2"}
                    strokeDasharray={isActive ? "none" : "6 4"}
                    opacity={isActive ? 1 : 0.4}
                    filter={isActive ? "url(#glowLine)" : "none"}
                    className={isActive ? "animate-pulse" : ""}
                  />
                );
              })}
            </svg>
          )}

          {/* Location Pins Layer */}
          {locations.map((loc, index) => {
            const isSelected = selectedLocation?.id === loc.id;
            const isHovered = hoveredLocation?.id === loc.id;
            const isMatch = matchesSearch(loc);
            const isCalibratingThis = calibratingLocationId === loc.id;

            if (!isMatch && searchQuery.trim()) return null;

            // Sleek theme alternating pins between Gold #C5A059 and Navy #1A365D
            const isEven = index % 2 === 0;

            return (
              <div
                key={loc.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectLocation(loc);
                }}
                onMouseEnter={() => onHoverLocation(loc)}
                onMouseLeave={() => onHoverLocation(null)}
                className={`absolute group cursor-pointer z-20 transition-all duration-300 ${
                  isSelected ? 'z-30 scale-125' : isHovered ? 'z-25 scale-110' : 'scale-100'
                }`}
                style={{
                  left: `${loc.x}%`,
                  top: `${loc.y}%`,
                  transform: 'translate(-50%, -50%)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Pulsing Target Rings */}
                {(isSelected || isHovered || isCalibratingThis) && (
                  <div className="absolute -inset-3 rounded-full bg-[#C5A059]/40 animate-ping pointer-events-none" />
                )}

                {/* 3D Pin Badge with Gold/Navy Luxury Theme */}
                <div
                  className={`relative flex items-center justify-center font-bold shadow-lg ring-4 ring-white cursor-pointer transition-transform duration-300 rounded-full text-white font-sans ${
                    isSelected
                      ? 'w-10 h-10 bg-[#1A365D] ring-amber-400 ring-4 shadow-xl'
                      : isEven
                      ? 'w-10 h-10 bg-[#C5A059]'
                      : 'w-10 h-10 bg-[#1A365D]'
                  }`}
                  style={{
                    // Counter-tilt pin face so it remains upright to viewer in 3D
                    transform: is3DTilted ? 'rotateX(-32deg) rotateY(6deg)' : 'none',
                  }}
                >
                  {/* Pin Code Number */}
                  <span className="drop-shadow-sm font-extrabold text-xs">{loc.code}</span>

                  {/* Pin Drop Shadow */}
                  <div className="absolute -bottom-2 w-5 h-2 rounded-full bg-black/30 blur-xs" />
                </div>

                {/* Hover Quick Card Preview Tooltip */}
                {(isHovered || isSelected) && !isCalibratingPin && (
                  <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-60 p-3 rounded-2xl bg-white border border-gray-100 text-[#2D3748] shadow-2xl pointer-events-none transition-all duration-200 animate-fadeIn"
                    style={{
                      transform: is3DTilted 
                        ? 'translate(-50%, 0) rotateX(-32deg) rotateY(6deg)' 
                        : 'translate(-50%, 0)',
                    }}
                  >
                    {(() => {
                      const displayImg = loc.images?.find(img => img.mediaType !== 'video') || loc.images?.[0];
                      if (!displayImg) return null;
                      
                      let imgUrl = displayImg.url;
                      const isVideo = displayImg.mediaType === 'video';
                      if (isVideo) {
                        if (imgUrl.includes('youtube.com') || imgUrl.includes('youtu.be')) {
                          const match = imgUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                          if (match) imgUrl = `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
                        } else if (imgUrl.includes('drive.google.com') || imgUrl.includes('googleusercontent.com')) {
                          const match = imgUrl.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?id=)|lh3\.googleusercontent\.com\/d\/)([a-zA-Z0-9_-]+)/);
                          if (match) imgUrl = `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
                        }
                      }

                      return (
                        <div className="w-full h-28 rounded-xl overflow-hidden mb-2 bg-gray-100 shadow-sm relative flex items-center justify-center">
                          {isVideo && !imgUrl.includes('youtube.com') && !imgUrl.includes('drive.google.com') && !imgUrl.includes('googleusercontent.com') ? (
                            <video src={imgUrl} className="w-full h-full object-cover" />
                          ) : (
                            <img
                              src={imgUrl}
                              alt={loc.title}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          )}
                          {isVideo && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                              <Video className="w-6 h-6 text-white" />
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="px-1.5 py-0.5 rounded bg-[#C5A059] text-white text-[10px] font-bold">
                        #{loc.code}
                      </span>
                      <h4 className="font-serif font-bold text-xs truncate text-[#1A365D]">{loc.title}</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 leading-snug">
                      {loc.subtitle || loc.description}
                    </p>
                    <div className="mt-2 text-[10px] font-bold text-[#1A365D] flex items-center justify-between border-t border-gray-100 pt-1.5">
                      <span>Nhấp để xem chi tiết →</span>
                      {loc.openingHours && <span className="text-gray-400 font-normal">{loc.openingHours}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
