import React, { useState, useEffect } from 'react';
import { LocationItem, ResortConfig, CategoryType, LightingMode } from './types';
import { INITIAL_LOCATIONS, DEFAULT_RESORT_CONFIG } from './data/resortData';
import { Navbar } from './components/Navbar';
import { ResortMap } from './components/ResortMap';
import { LocationModal } from './components/LocationModal';
import { Sidebar } from './components/Sidebar';
import { AdminApp } from './components/AdminApp';
import { AmbientAudio } from './components/AmbientAudio';
import { WeatherModal } from './components/WeatherModal';
import { TourPlayerBar } from './components/TourPlayerBar';
import { fetchMuiNeWeather, WeatherData, getVietnamHoursAndMinutes, getVietnamLightingMode } from './services/weatherService';

export default function App() {
  if (window.location.pathname === '/quanly') {
    return <AdminApp />;
  }
  // Calculate initial lighting mode based on Vietnam timezone (UTC+7)
  const { hours: initHours, minutes: initMinutes } = getVietnamHoursAndMinutes();
  const initialLightingMode = getVietnamLightingMode(initHours, initMinutes);

  // Load initial state from localStorage as instant cache (shown before API responds)
  const [locations, setLocations] = useState<LocationItem[]>(() => {
    try {
      const cached = localStorage.getItem('cliff_resort_locations_v2');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return INITIAL_LOCATIONS;
  });
  const [resortConfig, setResortConfig] = useState<ResortConfig>(() => {
    try {
      const cached = localStorage.getItem('cliff_resort_config_v2');
      if (cached) return JSON.parse(cached);
    } catch (e) {}
    return DEFAULT_RESORT_CONFIG;
  });
  const [isDataLoaded, setIsDataLoaded] = useState<boolean>(false);

  useEffect(() => {
    // Server/cloud data ALWAYS wins — localStorage is only a fallback for offline/error
    fetch('/api/data')
      .then(res => {
        if (!res.ok) throw new Error("No data on server");
        return res.json();
      })
      .then(data => {
        if (data && data.locations) {
          setLocations(data.locations);
          // Keep localStorage in sync so next cold load is instant
          try { localStorage.setItem('cliff_resort_locations_v2', JSON.stringify(data.locations)); } catch (_e) {}
        }

        if (data && data.config) {
          if (!data.config.mapImageBg || data.config.mapImageBg.includes('photo-1540555700478')) {
            data.config.mapImageBg = DEFAULT_RESORT_CONFIG.mapImageBg;
          }
          setResortConfig(data.config);
          // Keep localStorage in sync
          try { localStorage.setItem('cliff_resort_config_v2', JSON.stringify(data.config)); } catch (_e) {}
        }
      })
      .catch(_e => {
        // API unreachable — keep using localStorage cache silently
        console.log("API unavailable, using cached data.");
      })
      .finally(() => setIsDataLoaded(true));
  }, []);

  // Selected Location for Detail Modal
  const [selectedLocation, setSelectedLocation] = useState<LocationItem | null>(null);
  const [hoveredLocation, setHoveredLocation] = useState<LocationItem | null>(null);

  // Tour State
  const [isTourMode, setIsTourMode] = useState<boolean>(false);
  const [activeTourStepIdx, setActiveTourStepIdx] = useState<number>(0);

  // Filters & Modes
  const [activeCategory, setActiveCategory] = useState<CategoryType | 'all'>('all');
  const [lightingMode, setLightingMode] = useState<LightingMode>(initialLightingMode);
  const [is3DTilted, setIs3DTilted] = useState<boolean>(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Panels
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState<boolean>(false);

  // User Interactive Weather Effect Mode ('auto' | 'none' | 'clear' | 'rain' | 'cloudy' | 'fog' | 'thunderstorm')
  const [weatherOverlayMode, setWeatherOverlayMode] = useState<WeatherOverlayType>(() => {
    try {
      const saved = localStorage.getItem('cliff_weather_overlay_preference');
      if (saved) return saved as WeatherOverlayType;
    } catch (e) {}
    return 'auto';
  });

  const handleSelectWeatherOverlay = (mode: WeatherOverlayType) => {
    setWeatherOverlayMode(mode);
    try {
      localStorage.setItem('cliff_weather_overlay_preference', mode);
    } catch (e) {}
  };

  const handleToggleWeatherOverlay = () => {
    const nextMode: WeatherOverlayType = weatherOverlayMode === 'none' ? 'auto' : 'none';
    handleSelectWeatherOverlay(nextMode);
  };

  // Live Mui Ne Weather Telemetry State
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isRefreshingWeather, setIsRefreshingWeather] = useState<boolean>(false);

  // Fetch real-time weather from Open-Meteo for Mui Ne, Phan Thiet
  const loadWeather = async () => {
    setIsRefreshingWeather(true);
    try {
      const data = await fetchMuiNeWeather(resortConfig.weatherStationLat, resortConfig.weatherStationLng);
      setWeatherData(data);

      // Auto sync map lighting mode to Vietnam standard time (UTC+7)
      setLightingMode(data.lightingMode);

      if (resortConfig.autoSyncWeather !== false) {
        setResortConfig(prev => ({
          ...prev,
          weatherTemperature: `${data.temperature}°C - ${data.conditionText}`
        }));
      }
    } catch (e) {
      console.warn("Error updating weather telemetry:", e);
    } finally {
      setIsRefreshingWeather(false);
    }
  };

  useEffect(() => {
    loadWeather();
    // Auto-refresh every 10 minutes
    const interval = setInterval(() => {
      loadWeather();
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [resortConfig.autoSyncWeather]);

  // Calibrator Mode State
  const [isCalibratingPin, setIsCalibratingPin] = useState<boolean>(false);
  const [calibratingLocationId, setCalibratingLocationId] = useState<string | null>(null);

  // Check URL parameters (e.g. ?embed=true or ?location=loc-1)
  const isEmbedMode = new URLSearchParams(window.location.search).get('embed') === 'true';

  useEffect(() => {
    const locParam = new URLSearchParams(window.location.search).get('location');
    if (locParam) {
      const found = locations.find(l => l.id === locParam || l.code === locParam);
      if (found) {
        setSelectedLocation(found);
      }
    }
  }, [locations]);

  // Unified save handler
  const handleSaveAllData = (newLocs: LocationItem[], newCfg: ResortConfig) => {
    setLocations(newLocs);
    setResortConfig(newCfg);
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: newLocs, config: newCfg })
    }).catch(e => console.error("Error saving data", e));
  };

  // Reset to default
  const handleResetToDefault = () => {
    setLocations(INITIAL_LOCATIONS);
    setResortConfig(DEFAULT_RESORT_CONFIG);
    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ locations: INITIAL_LOCATIONS, config: DEFAULT_RESORT_CONFIG })
    }).catch(e => console.error("Error saving data", e));
  };

  // Calibrator handler
  const handleStartPinCalibration = (id: string) => {
    setCalibratingLocationId(id);
    setIsCalibratingPin(true);
  };

  const handleUpdatePinPosition = (id: string, x: number, y: number) => {
    const updated = locations.map(loc => loc.id === id ? { ...loc, x, y } : loc);
    handleSaveLocations(updated);
    setIsCalibratingPin(false);
    setCalibratingLocationId(null);
    alert(`Đã cập nhật vị trí điểm ghim thành công! (X: ${x}%, Y: ${y}%)`);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#FDFCFB] font-sans text-[#2D3748] flex flex-col">
      {/* Background Ambient Wave Audio Synthesizer / Custom Ambient Music */}
      <AmbientAudio 
        isPlaying={isAudioPlaying} 
        customMusicUrl={resortConfig.ambientMusicUrl}
      />

      {/* Top Navbar Header (Hidden in embed=true mode if configured) */}
      {!isEmbedMode && (
        <Navbar
          resortConfig={resortConfig}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          lightingMode={lightingMode}
          setLightingMode={setLightingMode}
          is3DTilted={is3DTilted}
          setIs3DTilted={setIs3DTilted}
          isAudioPlaying={isAudioPlaying}
          setIsAudioPlaying={setIsAudioPlaying}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenSidebar={() => setIsSidebarOpen(prev => !prev)}
          onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
          weatherData={weatherData}
          hasTour={!!resortConfig.tourConfig?.steps?.length}
          onStartTour={() => {
            setActiveTourStepIdx(0);
            setIsTourMode(true);
          }}
        />
      )}

      {/* Tour Player Bar */}
      {isTourMode && resortConfig.tourConfig && (
        <TourPlayerBar
          tourConfig={resortConfig.tourConfig}
          locations={locations}
          activeStepIdx={activeTourStepIdx}
          onStepChange={setActiveTourStepIdx}
          onClose={() => setIsTourMode(false)}
          onSelectLocation={setSelectedLocation}
          defaultVoiceStyle={resortConfig.defaultVoiceStyle}
          defaultSpeechRate={resortConfig.defaultSpeechRate}
        />
      )}

      {/* Main Content View (Map + Collapsible Sidebar) */}
      <div className="relative flex-1 w-full h-full overflow-hidden flex">
        {/* Left Directory Sidebar */}
        <Sidebar
          locations={locations}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}
          hoveredLocation={hoveredLocation}
          onHoverLocation={setHoveredLocation}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          resortConfig={resortConfig}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          onOpenWeatherModal={() => setIsWeatherModalOpen(true)}
          weatherData={weatherData}
        />

        {/* 3D Map View Area */}
        <main className="flex-1 w-full h-full relative">
          <ResortMap
            locations={locations}
            mapImageBg={resortConfig.mapImageBg || '/cliff-map.svg'}
            selectedLocation={selectedLocation}
            onSelectLocation={setSelectedLocation}
            hoveredLocation={hoveredLocation}
            onHoverLocation={setHoveredLocation}
            is3DTilted={is3DTilted}
            lightingMode={lightingMode}
            searchQuery={searchQuery}
            isCalibratingPin={isCalibratingPin}
            calibratingLocationId={calibratingLocationId}
            onUpdatePinPosition={handleUpdatePinPosition}
            activeWeatherOverlay={weatherOverlayMode === 'auto' ? (resortConfig.activeWeatherOverlay || 'auto') : weatherOverlayMode}
            liveWeatherCategory={weatherData?.conditionCategory || 'clear'}
            onToggleWeatherEffect={handleToggleWeatherOverlay}
            isTourMode={isTourMode}
            tourConfig={resortConfig.tourConfig}
            activeTourStepIdx={activeTourStepIdx}
          />
        </main>
      </div>

      {/* Location Detail Slide Modal */}
      {selectedLocation && (
        <LocationModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          hotline={resortConfig.hotline}
          defaultVoiceStyle={resortConfig.defaultVoiceStyle}
          defaultSpeechRate={resortConfig.defaultSpeechRate}
          isTourMode={isTourMode}
        />
      )}

      {/* Mui Ne Weather Live Modal with Overlay Selector */}
      <WeatherModal
        isOpen={isWeatherModalOpen}
        onClose={() => setIsWeatherModalOpen(false)}
        weatherData={weatherData}
        onRefreshWeather={loadWeather}
        isRefreshing={isRefreshingWeather}
        activeOverlay={weatherOverlayMode}
        onSelectOverlay={handleSelectWeatherOverlay}
      />
    </div>
  );
}
