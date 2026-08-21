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
  Info
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-scale-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1A365D] via-[#2A4365] to-[#1A365D] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md">
              <CloudSun className="w-6 h-6 text-[#C5A059]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-serif font-bold">Trạm Thời Tiết Mũi Né</h3>
                <span className="px-2 py-0.5 text-[10px] bg-[#C5A059] text-white font-bold rounded-full uppercase">
                  Live API
                </span>
              </div>
              <p className="text-xs text-blue-100 flex items-center gap-1 mt-0.5">
                <Compass className="w-3.5 h-3.5 text-[#C5A059]" />
                Phú Hài, Mũi Né, TP. Phan Thiết, Bình Thuận
              </p>
            </div>
          </div>
        </div>

        {/* Content Body - Pure Reference Telemetry */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {/* Top Main Temperature Card */}
          <div className="bg-gradient-to-br from-[#F7FAFC] via-slate-50 to-amber-50/50 p-5 rounded-2xl border border-gray-200 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 bg-white rounded-2xl border border-gray-100 shadow-2xs">
                  {weatherData?.conditionCategory === 'clear' 
                    ? (weatherData?.lightingMode === 'night' ? '🌙' : weatherData?.lightingMode === 'sunset' ? '🌅' : '☀️') 
                    : weatherData?.conditionCategory === 'cloudy' ? '⛅' 
                    : weatherData?.conditionCategory === 'fog' ? '🌫️' 
                    : weatherData?.conditionCategory === 'rain' ? '🌧️' : '🌩️'}
                </span>
                <div>
                  <div className="text-2xl font-bold text-[#1A365D] leading-none">
                    {weatherData ? `${weatherData.temperature}°C` : '26°C'}
                  </div>
                  <div className="text-xs font-semibold text-[#C5A059] mt-1">
                    {weatherData?.conditionText || 'Gió Biển Đêm Mát Mẻ'}
                  </div>
                </div>
              </div>

              <button
                onClick={onRefreshWeather}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#1A365D] border border-gray-200 text-xs font-bold transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#C5A059] ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Cập nhật</span>
              </button>
            </div>

            {/* Timezone Vietnam Standard Time (UTC+7) */}
            <div className="flex items-center justify-between text-xs bg-white p-3 rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-600">Giờ chuẩn Việt Nam (UTC+7):</span>
                <strong className="text-[#1A365D] text-sm font-bold">{weatherData?.vietnamTimeStr || 'Đang đồng bộ'}</strong>
              </div>

              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${
                weatherData?.lightingMode === 'day' ? 'bg-amber-100 text-amber-900 border border-amber-200' :
                weatherData?.lightingMode === 'sunset' ? 'bg-orange-100 text-orange-900 border border-orange-200' :
                'bg-indigo-100 text-indigo-950 border border-indigo-200'
              }`}>
                {weatherData?.lightingMode === 'day' && <Sun className="w-3.5 h-3.5 text-amber-600" />}
                {weatherData?.lightingMode === 'sunset' && <Sunset className="w-3.5 h-3.5 text-orange-600" />}
                {weatherData?.lightingMode === 'night' && <Moon className="w-3.5 h-3.5 text-indigo-600" />}
                <span>
                  {weatherData?.lightingMode === 'day' ? 'Ban ngày (6h - 12h)' :
                   weatherData?.lightingMode === 'sunset' ? 'Buổi chiều (12h01 - 18h)' :
                   'Ban đêm (18h01 - 5h59)'}
                </span>
              </span>
            </div>
          </div>

          {/* Detailed Meteorological Metrics Grid */}
          <div className="space-y-2">
            <h4 className="font-bold text-[#1A365D] text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#C5A059]" />
              <span>Chỉ Số Thời Tiết Chi Tiết Tại Mũi Né</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-amber-50 rounded-xl border border-amber-100">
                  <Thermometer className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Cảm Nhận</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.apparentTemperature}°C` : '28°C'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
                  <Droplets className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Độ Ẩm</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.humidity}%` : '78%'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-teal-50 rounded-xl border border-teal-100">
                  <Wind className="w-4 h-4 text-teal-600" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Sức Gió Biển</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.windSpeed} km/h` : '14 km/h'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                  <CloudRain className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Lượng Mưa</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.precipitation} mm` : '0 mm'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100">
                  <Cloud className="w-4 h-4 text-slate-600" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Độ Che Phủ Mây</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData ? `${weatherData.cloudCover}%` : '25%'}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">UV Index</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData?.uvIndex ?? 0}
                  </span>
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl border border-gray-200/80 shadow-2xs flex items-center gap-2.5">
                <div className="p-2 bg-purple-50 rounded-xl border border-purple-100">
                  <CloudSun className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <span className="block text-[10px] text-gray-400 font-bold uppercase">Áp Suất</span>
                  <span className="text-xs font-bold text-[#1A365D]">
                    {weatherData?.pressure ? `${Math.round(weatherData.pressure)} hPa` : '1012 hPa'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Map Weather Overlay Customizer / On-Off Toggle */}
          {onSelectOverlay && (
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/50 p-4 rounded-2xl border border-gray-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#1A365D] text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-[#C5A059]" />
                  <span>Hiệu Ứng Thời Tiết Bản Đồ (Live Overlay)</span>
                </span>
                <span className="text-[10px] bg-white px-2 py-0.5 rounded-md font-bold text-[#1A365D] border border-gray-200">
                  {activeOverlay === 'none' ? '🚫 Đang Tắt' : activeOverlay === 'auto' ? '⚡ Tự Động' : '✨ Tùy Chỉnh'}
                </span>
              </div>

              <p className="text-[11px] text-gray-500 leading-relaxed">
                Bạn có thể bật hiệu ứng theo thời tiết thực tế hoặc tắt hoàn toàn để bản đồ luôn sáng trong, không có mưa hay sương mờ.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                {[
                  { id: 'auto', label: 'Tự Động Mũi Né', icon: '⚡', desc: 'Theo thời tiết live' },
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
                      className={`p-2.5 rounded-xl border text-left transition-all flex flex-col gap-0.5 ${
                        isSelected
                          ? 'bg-[#1A365D] text-white border-[#1A365D] shadow-sm scale-[1.02]'
                          : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <span className={`text-[10px] ${isSelected ? 'text-blue-200' : 'text-gray-400'}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Note Banner about Admin Configuration */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5 text-blue-900 text-[11px] leading-relaxed">
            <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              Thống kê thời tiết được cập nhật tự động từ trạm khí tượng vệ tinh Open-Meteo Mũi Né. Ban Quản Lý Resort có thể tùy chỉnh các thông số và lớp phủ bản đồ trong <b>Trang Quản Trị Admin</b>.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3.5 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[10px] italic">
            Lần cập nhật cuối: {weatherData?.lastUpdated || 'Vừa xong'}
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#1A365D] hover:bg-[#2A4365] text-white text-xs font-bold transition-all shadow-md"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

