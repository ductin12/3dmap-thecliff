import React from 'react';
import { 
  Compass, 
  Sun, 
  Moon, 
  Sunset, 
  Volume2, 
  VolumeX, 
  Settings, 
  Code, 
  Search, 
  Layers, 
  Sparkles,
  MapPin,
  PhoneCall,
  CloudSun
} from 'lucide-react';
import { CategoryType, LightingMode, ResortConfig } from '../types';
import { WeatherData } from '../services/weatherService';

interface NavbarProps {
  resortConfig: ResortConfig;
  activeCategory: CategoryType | 'all';
  setActiveCategory: (cat: CategoryType | 'all') => void;
  lightingMode: LightingMode;
  setLightingMode: (mode: LightingMode) => void;
  is3DTilted: boolean;
  setIs3DTilted: (val: boolean | ((prev: boolean) => boolean)) => void;
  isAudioPlaying: boolean;
  setIsAudioPlaying: (val: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenWordPress?: () => void;
  onOpenSidebar: () => void;
  onOpenWeatherModal: () => void;
  weatherData?: WeatherData | null;
  onStartTour?: () => void;
  hasTour?: boolean;
}

export const CATEGORIES: { id: CategoryType | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'Tất cả vị trí', icon: '📍' },
  { id: 'accommodation', label: 'Lưu Trú & Villa', icon: '🛏️' },
  { id: 'pool_beach', label: 'Hồ Bơi & Biển', icon: '🏊' },
  { id: 'dining', label: 'Ẩm Thực', icon: '🍽️' },
  { id: 'spa_wellness', label: 'Spa & Trị Liệu', icon: '🧘' },
  { id: 'recreation', label: 'Giải Trí & Thể Thao', icon: '🎮' },
  { id: 'facility', label: 'Tiện Ích & Dịch Vụ', icon: '🏛️' },
];

export const Navbar: React.FC<NavbarProps> = ({
  resortConfig,
  activeCategory,
  setActiveCategory,
  lightingMode,
  setLightingMode,
  is3DTilted,
  setIs3DTilted,
  isAudioPlaying,
  setIsAudioPlaying,
  searchQuery,
  setSearchQuery,
  onOpenWordPress,
  onOpenSidebar,
  onOpenWeatherModal,
  weatherData,
  onStartTour,
  hasTour
}) => {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 text-[#2D3748] shadow-sm transition-colors duration-300">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-[#1A365D] transition-colors"
            title="Mở danh sách vị trí"
          >
            <Layers className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveCategory('all')}>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg md:text-xl tracking-tight text-[#1A365D] leading-none">
                  {resortConfig.resortName.toUpperCase().includes('CLIFF') ? (
                    <>THE CLIFF <span className="font-light text-[#C5A059]">RESORT</span></>
                  ) : (
                    resortConfig.resortName
                  )}
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded bg-amber-50 text-[#C5A059] border border-[#C5A059]/30">
                  3D Map
                </span>
              </div>
              <p className="text-xs text-gray-500 hidden sm:block font-medium">
                {resortConfig.tagline}
              </p>
            </div>
          </div>
        </div>

        {/* Live Resort Status Badge & Search Bar */}
        <div className="flex-1 max-w-sm hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm vị trí (Phòng, Villa, Hồ bơi, Spa, Restaurant...)"
              className="w-full pl-10 pr-4 py-2 bg-[#F7FAFC] hover:bg-white focus:bg-white border border-gray-200 focus:border-[#1A365D] rounded-full text-xs text-[#2D3748] placeholder-gray-400 focus:outline-none transition-all shadow-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-700"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Controls & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Clickable Live Weather Status Badge */}
          <button
            onClick={onOpenWeatherModal}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-50 to-amber-100/60 hover:from-amber-100 hover:to-amber-200/80 border border-[#C5A059]/40 text-xs font-semibold text-[#1A365D] transition-all shadow-xs hover:shadow-sm"
            title="Xem thời tiết Mũi Né thời gian thực & chọn hiệu ứng"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
            <CloudSun className="w-4 h-4 text-[#C5A059]" />
            <span className="hidden sm:inline">Mũi Né:</span>
            <strong className="text-[#1A365D] font-bold">
              {weatherData ? `${weatherData.temperature}°C` : resortConfig.weatherTemperature}
            </strong>
            <span className="text-[10px] bg-[#C5A059] text-white px-1.5 py-0.5 rounded font-bold uppercase">
              Live
            </span>
          </button>

          {/* Start Tour Button */}
          {hasTour && onStartTour && (
            <button
              onClick={onStartTour}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A365D] hover:bg-[#2A4365] border border-[#1A365D] text-white text-xs font-semibold transition-all shadow-md animate-pulse"
            >
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              <span className="hidden sm:inline">Khám Phá Tour</span>
              <span className="sm:hidden">Tour</span>
            </button>
          )}

          {/* Hotline Quick Badge */}
          <a
            href={`tel:${resortConfig.hotline.replace(/\s+/g, '')}`}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold transition-colors"
          >
            <PhoneCall className="w-3.5 h-3.5 text-[#C5A059]" />
            <span>Hotline: {resortConfig.hotline}</span>
          </a>

          {/* 3D Tilt View Toggle */}
          <button
            onClick={() => setIs3DTilted(prev => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
              is3DTilted
                ? 'bg-[#1A365D] text-white font-semibold shadow-md border border-[#1A365D]'
                : 'bg-[#F7FAFC] hover:bg-gray-100 text-[#2D3748] border border-gray-200'
            }`}
            title="Chuyển đổi chế độ góc nhìn 3D nghiêng"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
            <span className="hidden sm:inline">Góc Nhìn 3D</span>
            <span className="sm:hidden">3D</span>
          </button>

          {/* Lighting Mode Toggle */}
          <div className="flex items-center bg-[#F7FAFC] border border-gray-200 rounded-lg p-0.5">
            <button
              onClick={() => setLightingMode('day')}
              className={`p-1.5 rounded-md transition-all ${
                lightingMode === 'day' 
                  ? 'bg-white text-amber-600 shadow-sm font-bold' 
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Khung cảnh Ban Ngày"
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('sunset')}
              className={`p-1.5 rounded-md transition-all ${
                lightingMode === 'sunset' 
                  ? 'bg-white text-orange-500 shadow-sm font-bold' 
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Khung cảnh Hoàng Hôn"
            >
              <Sunset className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setLightingMode('night')}
              className={`p-1.5 rounded-md transition-all ${
                lightingMode === 'night' 
                  ? 'bg-[#1A365D] text-white shadow-sm font-bold' 
                  : 'text-gray-400 hover:text-gray-700'
              }`}
              title="Khung cảnh Ban Đêm"
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ambient Sound Toggle */}
          <button
            onClick={() => setIsAudioPlaying(prev => !prev)}
            className={`p-2 rounded-lg border transition-all ${
              isAudioPlaying
                ? 'bg-amber-50 text-[#C5A059] border-[#C5A059]/40'
                : 'bg-[#F7FAFC] text-gray-500 border-gray-200 hover:bg-gray-100'
            }`}
            title={isAudioPlaying ? 'Tắt âm thanh sóng biển' : 'Bật âm thanh sóng biển thiên nhiên'}
          >
            {isAudioPlaying ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="bg-white border-t border-gray-100 px-4 py-2 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex items-center gap-3 min-w-max">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#1A365D] text-white shadow-sm scale-105'
                  : 'bg-[#F7FAFC] hover:bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
