import React from 'react';
import { LocationItem, CategoryType, ResortConfig } from '../types';
import { CATEGORIES } from './Navbar';
import { Search, MapPin, ChevronRight, X, Sparkles, Navigation, Phone, CloudSun } from 'lucide-react';
import { WeatherData } from '../services/weatherService';

interface SidebarProps {
  locations: LocationItem[];
  selectedLocation: LocationItem | null;
  onSelectLocation: (loc: LocationItem) => void;
  hoveredLocation: LocationItem | null;
  onHoverLocation: (loc: LocationItem | null) => void;
  activeCategory: CategoryType | 'all';
  setActiveCategory: (cat: CategoryType | 'all') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  resortConfig: ResortConfig;
  isOpen: boolean;
  onClose: () => void;
  onOpenWeatherModal?: () => void;
  weatherData?: WeatherData | null;
}

export const Sidebar: React.FC<SidebarProps> = ({
  locations,
  selectedLocation,
  onSelectLocation,
  hoveredLocation,
  onHoverLocation,
  activeCategory,
  setActiveCategory,
  searchQuery,
  setSearchQuery,
  resortConfig,
  isOpen,
  onClose,
  onOpenWeatherModal,
  weatherData
}) => {
  // Filtered location items
  const filteredLocations = locations.filter((loc) => {
    const matchesCat = activeCategory === 'all' || loc.category === activeCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || (
      loc.title.toLowerCase().includes(q) ||
      loc.subtitle.toLowerCase().includes(q) ||
      loc.code.toLowerCase().includes(q) ||
      loc.description.toLowerCase().includes(q)
    );
    return matchesCat && matchesQ;
  });

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-80 md:w-[380px] bg-white border-r border-gray-100 text-[#2D3748] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
      isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
    }`}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-gray-100 bg-[#FDFCFB] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#1A365D]">
            <MapPin className="w-4 h-4 text-[#1A365D]" />
          </div>
          <div>
            <span className="px-2 py-0.5 bg-blue-50 text-[#1A365D] text-[10px] font-bold uppercase tracking-widest rounded">
              Khu Vực Resort
            </span>
            <h2 className="font-serif font-bold text-lg md:text-xl text-[#1A365D]">
              Danh Sách ({filteredLocations.length})
            </h2>
          </div>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-4 border-b border-gray-100 space-y-3 bg-[#F7FAFC]">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên khu vực, phòng..."
            className="w-full pl-10 pr-8 py-2 bg-white border border-gray-200 focus:border-[#1A365D] rounded-xl text-xs text-[#2D3748] placeholder-gray-400 focus:outline-none transition-all shadow-sm"
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

        {/* Quick Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-[#1A365D] text-white shadow-sm'
                  : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {cat.icon} {cat.label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Locations List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <p className="text-sm text-gray-500 font-medium">Không tìm thấy khu vực phù hợp</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="text-xs text-[#1A365D] hover:underline font-bold"
            >
              Đặt lại bộ lọc search
            </button>
          </div>
        ) : (
          filteredLocations.map((loc) => {
            const isSelected = selectedLocation?.id === loc.id;
            const isHovered = hoveredLocation?.id === loc.id;

            return (
              <div
                key={loc.id}
                onClick={() => onSelectLocation(loc)}
                onMouseEnter={() => onHoverLocation(loc)}
                onMouseLeave={() => onHoverLocation(null)}
                className={`group p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-blue-50/70 border-[#1A365D] shadow-md scale-[1.01]'
                    : isHovered
                    ? 'bg-[#F7FAFC] border-gray-300 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-[#F7FAFC]'
                }`}
              >
                {/* Left Thumbnail & Number Badge */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 shadow-sm">
                    {(() => {
                      const displayImg = loc.images?.find(img => img.mediaType !== 'video') || loc.images?.[0];
                      if (!displayImg) {
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-[#1A365D] font-bold text-xs">
                            #{loc.code}
                          </div>
                        );
                      }
                      let imgUrl = displayImg.url;
                      if (displayImg.mediaType === 'video' && (imgUrl.includes('youtube.com') || imgUrl.includes('youtu.be'))) {
                         const match = imgUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                         if (match) imgUrl = `https://img.youtube.com/vi/${match[1]}/default.jpg`;
                      }
                      
                      return displayImg.mediaType === 'video' && !imgUrl.includes('youtube.com') ? (
                         <video src={imgUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                      ) : (
                        <img
                          src={imgUrl}
                          alt={loc.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      );
                    })()}
                    <span className="absolute top-0.5 left-0.5 px-1.5 py-0.2 rounded bg-[#C5A059] text-white font-bold text-[10px] shadow-sm">
                      #{loc.code}
                    </span>
                  </div>

                  {/* Title & Info */}
                  <div className="min-w-0">
                    <h3 className={`font-serif font-bold text-sm truncate transition-colors ${
                      isSelected ? 'text-[#1A365D]' : 'text-gray-800 group-hover:text-[#1A365D]'
                    }`}>
                      {loc.title}
                    </h3>
                    <p className="text-[11px] text-gray-500 truncate mt-0.5">{loc.subtitle}</p>
                    
                    {loc.distanceFromLobby && (
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-[#C5A059] font-bold">
                        <Navigation className="w-3 h-3 text-[#C5A059]" />
                        <span>{loc.distanceFromLobby}</span>
                      </div>
                    )}
                  </div>
                </div>

                <ChevronRight className={`w-4 h-4 flex-shrink-0 transition-transform ${
                  isSelected ? 'text-[#1A365D] translate-x-1' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
              </div>
            );
          })
        )}
      </div>

      {/* Resort Quick Info Footer */}
      <div className="p-4 bg-[#F7FAFC] border-t border-gray-100 space-y-2 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span className="font-serif font-bold text-[#1A365D] text-sm">{resortConfig.resortName}</span>
          <button
            onClick={onOpenWeatherModal}
            className="px-2.5 py-1 rounded-full bg-amber-50 hover:bg-amber-100 text-[#C5A059] border border-[#C5A059]/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
            title="Xem thời tiết Mũi Né"
          >
            <CloudSun className="w-3 h-3 text-[#C5A059]" />
            <span>{weatherData ? `${weatherData.temperature}°C` : resortConfig.weatherTemperature}</span>
          </button>
        </div>
        <p className="text-[11px] text-gray-500 line-clamp-1">{resortConfig.address}</p>
        <div className="pt-2 flex items-center justify-between border-t border-gray-200 text-[11px]">
          <a href={`tel:${resortConfig.hotline.replace(/\s+/g, '')}`} className="flex items-center gap-1 text-[#C5A059] font-bold hover:underline">
            <Phone className="w-3 h-3 text-[#C5A059]" />
            <span>{resortConfig.hotline}</span>
          </a>
          <a href={resortConfig.website} target="_blank" rel="noopener noreferrer" className="text-[#1A365D] font-bold hover:underline">
            Website chính thức →
          </a>
        </div>
      </div>
    </aside>
  );
};
