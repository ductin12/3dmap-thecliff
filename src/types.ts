export type CategoryType = 
  | 'accommodation' 
  | 'pool_beach' 
  | 'dining' 
  | 'spa_wellness' 
  | 'recreation' 
  | 'facility';

export interface SlideImage {
  id: string;
  url: string;
  title?: string;
  caption?: string;
  mediaType?: 'image' | 'video';
}

export interface LocationItem {
  id: string;
  code: string; // e.g., '1', '2', '3', '4A', '4B', '5', '6', '7', etc.
  title: string;
  subtitle: string;
  category: CategoryType;
  x: number; // percentage X position on map (0 - 100)
  y: number; // percentage Y position on map (0 - 100)
  description: string;
  highlights: string[];
  images: SlideImage[];
  openingHours?: string;
  contactExt?: string;
  capacity?: string;
  viewType?: string;
  amenities: string[];
  bookingLink?: string;
  bookingCtaText?: string; // Custom CTA button label e.g., "Đặt Phòng", "Đặt Bàn", "Book Lịch Spa"
  featured?: boolean;
  distanceFromLobby?: string; // e.g., "50m - 1 phút đi bộ"
}

export type WeatherOverlayType = 'auto' | 'clear' | 'cloudy' | 'fog' | 'rain' | 'thunderstorm' | 'none';

export interface TourStep {
  locationId: string;
  narrationScript: string;
}

export interface TourConfig {
  title: string;
  estimatedDuration: string;
  steps: TourStep[];
}

export interface ResortConfig {
  resortName: string;
  tagline: string;
  hotline: string;
  website: string;
  address: string;
  mapImageBg: string;
  weatherTemperature: string;
  ambientSoundEnabled: boolean;
  ambientMusicUrl?: string; // Link bản nhạc nền tùy chỉnh (MP3/Audio URL)
  defaultVoiceStyle?: string; // Giọng đọc thuyết minh mặc định (Voice ID từ API)
  defaultSpeechRate?: number; // Tốc độ đọc mặc định
  autoSyncWeather?: boolean; // Tự động đồng bộ thời tiết Mũi Né từ API
  activeWeatherOverlay?: WeatherOverlayType; // Hiệu ứng lớp phủ thời tiết thủ công
  weatherStationLat?: number;
  weatherStationLng?: number;
  tourConfig?: TourConfig;
}

export type LightingMode = 'day' | 'sunset' | 'night';

export interface MapTransform {
  scale: number;
  translateX: number;
  translateY: number;
  rotateX: number;
  rotateY: number;
}

export type UserRole = 'admin' | 'editor' | 'user';

export interface User {
  id: string;
  username: string;
  password?: string; // in a real app this is hashed, but for demo we will keep it simple
  role: UserRole;
  fullName: string;
}
