import React from 'react';
import { 
  CloudSun, 
  Wind, 
  Droplets, 
  Compass, 
  RefreshCw, 
  X,
  CloudRain,
  Sun,
  Moon,
  Sunset,
  Cloud,
  Thermometer,
  ShieldCheck,
  Info,
  Sparkles,
  Gauge,
  Eye
} from 'lucide-react';
import { WeatherData } from '../services/weatherService';
import { WeatherOverlayType } from '../types';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: WeatherData | null;
  onRefreshWeather: () => void;
  isRefreshing: boolean;
  activeOverlay?: WeatherOverlayType;
  onSelectOverlay?: (overlay: WeatherOverlayType) => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  isOpen,
  onClose,
  weatherData,
  onRefreshWeather,
  isRefreshing,
  activeOverlay = 'auto',
  onSelectOverlay,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Card - Bottom Sheet on mobile, centered card on desktop */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-gray-100 max-h-[92vh] flex flex-col animate-slideUp sm:animate-none">
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-[#1A365D] via-[#24416B] to-[#1A365D] text-white px-5 py-4 sm:px-6 sm:py-5 relative shrink-0 border-b border-white/10">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
            title="Đóng bảng thời tiết"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 pr-10">
            <div className="w-10 h-10 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <CloudSun className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-serif font-bold tracking-tight truncate">
                  Trạm Thời Tiết Mũi Né
                </h3>
                <span className="px-2 py-0.5 text-[9px] bg-[#C5A059] text-white font-extrabold rounded-full uppercase tracking-wider shadow-xs">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-blue-100/90 flex items-center gap-1 mt-0.5 truncate">
                <Compass className="w-3 h-3 text-[#C5A059] shrink-0" />
                <span>The Cliff Resort, Mũi Né, Bình Thuận</span>
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          
          {/* Main Temperature & Time Card */}
          <div className="bg-gradient-to-br from-[#F7FAFC] via-slate-50 to-amber-50/40 p-4 sm:p-5 rounded-2xl border border-gray-200/90 space-y-3.5 shadow-xs">
            
            {/* Top row: Weather Icon, Temperature & Refresh Button */}
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-gray-200/70">
              <div className="flex items-center gap-3">
                <div className="text-3xl sm:text-4xl p-2.5 bg-white rounded-2xl border border-gray-100 shadow-xs flex items-center justify-center">
                  {weatherData?.conditionCategory === 'clear' 
                    ? (weatherData?.lightingMode === 'night' ? '🌙' : weatherData?.lightingMode === 'sunset' ? '🌅' : '☀️') 
                    : weatherData?.conditionCategory === 'cloudy' ? '⛅' 
                    : weatherData?.conditionCategory === 'fog' ? '🌫️' 
                    : weatherData?.conditionCategory === 'rain' ? '🌧️' : '🌩️'}
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#1A365D] tracking-tight leading-none">
                    {weatherData ? `${weatherData.temperature}°C` : '31°C'}
                  </div>
                  <div className="text-xs font-bold text-[#C5A059] mt-1 line-clamp-1">
                    {weatherData?.conditionText || 'Nắng Ráo, Gió Biển Dịu'}
                  </div>
                </div>
              </div>

              <button
                onClick={onRefreshWeather}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#1A365D] border border-gray-200 text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Cập nhật</span>
              </button>
            </div>

            {/* Bottom row: Time and Period Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center justify-between sm:justify-start gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200/80 shadow-2xs">
                <span className="text-gray-500 font-medium text-[11px]">Giờ Việt Nam (UTC+7):</span>
                <strong className="text-[#1A365D] text-xs font-bold">{weatherData?.vietnamTimeStr || '15:20'}</strong>
              </div>

              <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between sm:justify-center gap-1.5 shadow-2xs ${
                weatherData?.lightingMode === 'day' ? 'bg-amber-50 text-amber-900 border border-amber-200' :
                weatherData?.lightingMode === 'sunset' ? 'bg-orange-50 text-orange-900 border border-orange-200' :
                'bg-indigo-50 text-indigo-950 border border-indigo-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  {weatherData?.lightingMode === 'day' && <Sun className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                  {weatherData?.lightingMode === 'sunset' && <Sunset className="w-3.5 h-3.5 text-orange-600 shrink-0" />}
                  {weatherData?.lightingMode === 'night' && <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                  <span>
                    {weatherData?.lightingMode === 'day' ? 'Ban ngày (6h - 12h)' :
                     weatherData?.lightingMode === 'sunset' ? 'Buổi chiều (12h01 - 18h)' :
                     'Ban đêm (18h01 - 5h59)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Meteorological Metrics Grid (Balanced 6-Item Grid) */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#1A365D] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#C5A059]" />
              <span>Chỉ Số Thời Tiết Chi Tiết Tại Mũi Né</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
              {/* Metric 1: Cảm nhận */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100 shrink-0">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase truncate">Cảm Nhận</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.apparentTemperature}°C` : '34°C'}
                  </span>
                </div>
              </div>

              {/* Metric 2: Độ ẩm */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-100 shrink-0">
                  <Droplets className="w-4 h-4 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase truncate">Độ Ẩm</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.humidity}%` : '66%'}
                  </span>
                </div>
              </div>

              {/* Metric 3: Sức gió biển */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 rounded-xl border border-teal-100 shrink-0">
                  <Wind className="w-4 h-4 text-teal-600" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase truncate">Sức Gió Biển</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.windSpeed} km/h` : '24 km/h'}
                  </span>
                </div>
              </div>

              {/* Metric 4: Lượng mưa */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100 shrink-0">
                  <CloudRain className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase truncate">Lượng Mưa</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.precipitation} mm` : '0.1 mm'}
                  </span>
                </div>
              </div>

              {/* Metric 5: Độ che phủ mây */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                  <Cloud className="w-4 h-4 text-slate-600" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase truncate">Độ Che Phủ Mây</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.cloudCover}%` : '47%'}
                  </span>
                </div>
              </div>

              {/* Metric 6: UV Index */}
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 shrink-0">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <span className="block text-[10px] text-gray-400 font-bold uppercase truncate">UV Index</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData?.uvIndex ?? 8}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Weather Overlay Customizer / On-Off Toggle */}
          {onSelectOverlay && (
            <div className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-50 p-4 rounded-2xl border border-gray-200/90 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-[#1A365D] text-xs flex items-center gap-1.5 uppercase tracking-wider truncate">
                  <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0" />
                  <span>Hiệu Ứng Bản Đồ</span>
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold text-[#1A365D] border border-gray-200 shrink-0">
                  {activeOverlay === 'none' ? '🚫 Đang Tắt' : activeOverlay === 'auto' ? '⚡ Tự Động' : '✨ Tùy Chỉnh'}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Bật hiệu ứng theo thời tiết thực tế hoặc tắt hoàn toàn để bản đồ luôn sáng trong, không có mưa hay sương mờ.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'auto', label: 'Tự Động', icon: '⚡', desc: 'Theo thời tiết live' },
                  { id: 'none', label: 'Tắt Hiệu Ứng', icon: '🚫', desc: 'Bản đồ trong suốt' },
                  { id: 'clear', label: 'Nắng Vàng', icon: '☀️', desc: 'Tia nắng biển' },
                  { id: 'rain', label: 'Mưa Rơi', icon: '🌧️', desc: 'Hạt mưa 3D' },
                  { id: 'cloudy', label: 'Nhiều Mây', icon: '☁️', desc: 'Bóng mây dịu' },
                  { id: 'fog', label: 'Sương Mù', icon: '🌫️', desc: 'Làn sương biển' },
                ].map((item) => {
                  const isSelected = activeOverlay === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onSelectOverlay(item.id as WeatherOverlayType)}
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 active:scale-95 ${
                        isSelected
                          ? 'bg-[#1A365D] text-white border-[#1A365D] shadow-sm'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className={`text-[10px] truncate ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Banner */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5 text-blue-900 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              Dữ liệu được cập nhật tự động từ trạm khí tượng vệ tinh Mũi Né. Ban Quản Lý Resort có thể tùy chỉnh các thông số trong <b>Trang Quản Trị Admin</b>.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-3 sm:px-6 sm:py-3.5 border-t border-gray-100 flex items-center justify-between text-xs shrink-0">
          <span className="text-gray-400 text-[10px] italic truncate pr-2">
            Cập nhật: {weatherData?.lastUpdated || 'Vừa xong'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1A365D] hover:bg-[#2A4365] text-white text-xs font-bold transition-all shadow-md active:scale-95 shrink-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};


