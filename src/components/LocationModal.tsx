import React, { useState, useEffect } from 'react';
import { LocationItem } from '../types';
import { globalAudioNarrator } from '../utils/speechUtils';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Volume2, 
  Clock, 
  Users, 
  Eye, 
  CheckCircle2, 
  ExternalLink, 
  Phone, 
  Share2,
  Navigation,
  Sparkles,
  Loader2,
  Video
} from 'lucide-react';

interface LocationModalProps {
  location: LocationItem | null;
  onClose: () => void;
  hotline: string;
  defaultVoiceStyle?: 'female_ai' | 'male_ai' | 'web_natural' | string;
  defaultSpeechRate?: number;
  isTourMode?: boolean;
}

// Helper to check if a slide is a video
function isMediaVideo(slide?: { url?: string; mediaType?: string }): boolean {
  if (!slide || !slide.url) return false;
  if (slide.mediaType === 'video') return true;
  const urlLower = slide.url.toLowerCase();
  if (
    urlLower.includes('youtube.com') ||
    urlLower.includes('youtu.be') ||
    urlLower.match(/\.(mp4|mov|avi|webm|mkv|wmv|flv|m4v|3gp)(\?|$)/) ||
    urlLower.includes('drive.google.com') ||
    urlLower.includes('googleusercontent.com')
  ) {
    if (!urlLower.match(/\.(jpg|jpeg|png|webp|gif|svg|heic)(\?|$)/)) {
      return true;
    }
  }
  return false;
}

// Helper to extract Google Drive file ID from any URL format
function getGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const match = url.match(/(?:drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=download&)?id=)|lh3\.googleusercontent\.com\/d\/|drive\.usercontent\.google\.com\/download\?id=)([a-zA-Z0-9_-]{20,})/);
  if (match) return match[1];
  const genericMatch = url.match(/[?&]id=([a-zA-Z0-9_-]{20,})/);
  if (genericMatch) return genericMatch[1];
  return null;
}

// Dedicated Video Slide Player Component
const VideoSlidePlayer: React.FC<{
  url: string;
  title?: string;
  isFullscreen?: boolean;
}> = ({ url, title, isFullscreen = false }) => {
  // YouTube detection
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  let ytId = '';
  if (isYouTube) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
    if (match) ytId = match[1];
  }

  if (isYouTube && ytId) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=0&loop=1&playlist=${ytId}&playsinline=1`}
        title={title || "YouTube video player"}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="w-full h-full border-0"
      />
    );
  }

  const gdriveId = getGoogleDriveId(url);

  // Google Drive Video Handling
  if (gdriveId) {
    return (
      <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
        <iframe
          src={`https://drive.google.com/file/d/${gdriveId}/preview`}
          title={title || "Google Drive Video"}
          className="w-full h-full border-0 object-contain"
          allow="autoplay; fullscreen; encrypted-media"
          allowFullScreen
        />
      </div>
    );
  }

  // Direct MP4 / WebM / Local video URL
  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <video
        key={url}
        src={url}
        controls
        playsInline
        autoPlay
        muted
        loop
        className="w-full h-full object-contain bg-black"
      />
    </div>
  );
};

export const LocationModal: React.FC<LocationModalProps> = ({
  location,
  onClose,
  hotline,
  defaultVoiceStyle = 'female_ai',
  defaultSpeechRate = 1.0,
  isTourMode = false
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Audio Narration States
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [voiceStyle, setVoiceStyle] = useState<string>(defaultVoiceStyle || '');
  const [speechRate, setSpeechRate] = useState<number>(defaultSpeechRate);

  useEffect(() => {
    setVoiceStyle(defaultVoiceStyle);
    setSpeechRate(defaultSpeechRate);
  }, [defaultVoiceStyle, defaultSpeechRate]);

  // Stop audio and reset state when location changes or modal unmounts
  useEffect(() => {
    setActiveSlideIndex(0);
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoadingAudio(false);
    if (!isTourMode) {
      globalAudioNarrator.stop();
    }
  }, [location, isTourMode]);

  // Clean up audio on modal unmount
  useEffect(() => {
    return () => {
      if (!isTourMode) {
        globalAudioNarrator.stop();
      }
    };
  }, [isTourMode]);

  if (!location) return null;

  const slides = location.images && location.images.length > 0 
    ? location.images 
    : [{ id: 'fallback', url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop', title: location.title }];

  const currentSlide = slides[activeSlideIndex];

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Start or toggle AI audio speech narration directly
  const handleTogglePlayAudio = async () => {
    if (isPlaying) {
      globalAudioNarrator.stop();
      setIsPlaying(false);
      setIsPaused(false);
      setIsLoadingAudio(false);
      return;
    }

    const narrationText = location.description;
    
    setIsLoadingAudio(true);

    await globalAudioNarrator.speak({
      id: location.id,
      text: narrationText,
      title: location.title,
      voiceStyle,
      speechRate,
      onStart: () => {
        setIsPlaying(true);
        setIsPaused(false);
        setIsLoadingAudio(false);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoadingAudio(false);
      },
      onError: (err) => {
        console.warn(err);
        setIsPlaying(false);
        setIsPaused(false);
        setIsLoadingAudio(false);
      },
      onLoading: (loading) => {
        setIsLoadingAudio(loading);
      }
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}?location=${location.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getCtaText = () => {
    if (location.bookingCtaText && location.bookingCtaText.trim() !== '') {
      return location.bookingCtaText;
    }
    switch (location.category) {
      case 'accommodation':
        return 'ĐẶT PHÒNG NGAY';
      case 'dining':
        return 'ĐẶT BÀN NGAY';
      case 'spa_wellness':
        return 'BOOK LỊCH SPA';
      case 'recreation':
        return 'ĐẶT DỊCH VỤ GIẢI TRÍ';
      case 'pool_beach':
        return 'KHÁM PHÁ & GIỮ CHỖ';
      case 'facility':
        return 'LIÊN HỆ DỊCH VỤ';
      default:
        return 'ĐẶT KHU VỰC NÀY';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center sm:p-3 md:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full h-[95vh] md:h-auto md:max-h-[92vh] max-w-4xl bg-white border border-gray-100 rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#2D3748] transition-transform animate-slideUp md:animate-none">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-[#FDFCFB] border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#C5A059] text-white font-extrabold text-sm flex items-center justify-center shadow-md shrink-0">
              #{location.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-50 text-[#1A365D] text-[10px] font-bold uppercase tracking-widest rounded">
                  Luxury Zone
                </span>
              </div>
              <h2 className="text-lg md:text-2xl font-serif font-bold text-[#1A365D] leading-tight mt-0.5">
                {location.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Guide Quick Toggle Button */}
            <button
              onClick={handleTogglePlayAudio}
              className={`p-2.5 rounded-xl transition-all border shadow-xs ${
                isPlaying
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md animate-pulse'
                  : isLoadingAudio
                  ? 'bg-amber-50 text-amber-600 border-amber-200'
                  : 'bg-[#F7FAFC] hover:bg-amber-50 text-gray-600 hover:text-[#C5A059] border-gray-200'
              }`}
              title={isPlaying ? "Dừng thuyết minh" : "Nghe thuyết minh"}
            >
              {isLoadingAudio ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : isPlaying ? (
                <Volume2 className="w-4 h-4 text-white" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#C5A059]" />
              )}
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="p-2.5 rounded-xl bg-[#F7FAFC] hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
              title="Sao chép liên kết chia sẻ"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-[#F7FAFC] hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 md:space-y-6 custom-scrollbar">
          
          {/* SLIDE IMAGE CAROUSEL SECTION */}
          <div className="relative group w-full aspect-video rounded-2xl overflow-hidden bg-black border border-gray-200 shadow-md flex items-center justify-center">
            {isMediaVideo(currentSlide) ? (
              <VideoSlidePlayer url={currentSlide.url} title={currentSlide.title || location.title} />
            ) : (
              <img
                src={currentSlide.url}
                alt={currentSlide.title || location.title}
                className="w-full h-full object-cover transition-all duration-500"
                referrerPolicy="no-referrer"
              />
            )}

            {/* Slide Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md active:scale-95 z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md active:scale-95 z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Lightbox Fullscreen Button */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-2.5 right-2.5 w-8 h-8 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 shadow-md active:scale-95 z-10"
              title="Xem toàn màn hình"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>

            {/* Slide Counter Badge */}
            {slides.length > 1 && (
              <div className="absolute bottom-2.5 right-2.5 pointer-events-none z-10">
                <span className="px-2.5 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white/90 shadow-sm">
                  {activeSlideIndex + 1} / {slides.length}
                </span>
              </div>
            )}
          </div>

          {/* Slide Thumbnails Row */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {slides.map((slide, idx) => {
                const isVideo = isMediaVideo(slide);
                const isYouTube = isVideo && (slide.url.includes('youtube.com') || slide.url.includes('youtu.be'));
                let ytId = '';
                if (isYouTube) {
                   const match = slide.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                   if (match) ytId = match[1];
                }
                const gdriveId = getGoogleDriveId(slide.url);
                
                return (
                <button
                  key={slide.id || idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`relative flex-shrink-0 w-16 h-12 md:w-20 md:h-14 rounded-xl overflow-hidden border-2 transition-all bg-gray-900 ${
                    activeSlideIndex === idx
                      ? 'border-[#1A365D] ring-2 ring-[#1A365D]/30 scale-105'
                      : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  {isVideo ? (
                    isYouTube && ytId ? (
                      <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} className="w-full h-full object-cover opacity-80" />
                    ) : gdriveId ? (
                      <img 
                        src={`https://drive.google.com/thumbnail?id=${gdriveId}&sz=w200`} 
                        alt={slide.title || 'Video Thumbnail'}
                        className="w-full h-full object-cover opacity-80" 
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = `https://lh3.googleusercontent.com/d/${gdriveId}=w400`;
                        }}
                      />
                    ) : (
                      <video src={slide.url} className="w-full h-full object-cover opacity-80" />
                    )
                  ) : (
                    <img
                      src={slide.url}
                      alt={slide.title || `Slide ${idx + 1}`}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Video className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                </button>
              )})}
            </div>
          )}

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 md:gap-3 p-3.5 md:p-4 rounded-2xl bg-[#F7FAFC] border border-gray-100">
            {location.openingHours && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Giờ hoạt động</p>
                  <p className="text-xs font-bold text-[#1A365D]">{location.openingHours}</p>
                </div>
              </div>
            )}

            {location.capacity && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold shrink-0">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Sức chứa</p>
                  <p className="text-xs font-bold text-[#1A365D]">{location.capacity}</p>
                </div>
              </div>
            )}

            {location.viewType && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold shrink-0">
                  <Eye className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Hướng nhìn</p>
                  <p className="text-xs font-bold text-[#1A365D]">{location.viewType}</p>
                </div>
              </div>
            )}

            {location.distanceFromLobby && (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold shrink-0">
                  <Navigation className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Vị trí từ Sảnh</p>
                  <p className="text-xs font-bold text-[#1A365D]">{location.distanceFromLobby}</p>
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#1A365D] uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-[#C5A059]" />
                <span>Mô Tả Chi Tiết Khu Vực</span>
              </h3>

              <button
                type="button"
                onClick={handleTogglePlayAudio}
                className={`text-[11px] font-bold flex items-center gap-1 transition-colors ${
                  isPlaying ? 'text-amber-600 font-extrabold animate-pulse' : 'text-[#C5A059] hover:underline'
                }`}
              >
                {isLoadingAudio ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
                <span>{isPlaying ? 'Dừng đọc' : 'Nghe đọc AI'}</span>
              </button>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed bg-[#FDFCFB] p-4 rounded-2xl border border-gray-100 shadow-xs">
              {location.description}
            </p>
          </div>

          {/* Highlights List */}
          {location.highlights && location.highlights.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-[#1A365D] uppercase tracking-widest">
                Điểm Nổi Bật Đặc Quyền
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {location.highlights.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 p-3 rounded-xl bg-[#F7FAFC] border border-gray-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-700 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Amenities Badges */}
          {location.amenities && location.amenities.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Tiện Nghi & Dịch Vụ Đi Kèm
              </h3>
              <div className="flex flex-wrap gap-2">
                {location.amenities.map((amenity, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-lg bg-[#F7FAFC] border border-gray-200 text-xs font-medium text-gray-700"
                  >
                    ✨ {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer CTA */}
        <div className="p-4 md:p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs text-gray-600">Lễ Tân / Đặt phòng: <strong className="text-[#1A365D]">{hotline}</strong></span>
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              onClick={onClose}
              className="px-4 md:px-5 py-2.5 md:py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition-colors shadow-xs"
            >
              Đóng
            </button>
            
            <a
              href={location.bookingLink || `tel:${hotline}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 rounded-xl bg-[#C5A059] hover:bg-[#B38E47] text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <span className="uppercase">{getCtaText()}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      {/* Lightbox Fullscreen Popup with Slide Navigation */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-3 sm:p-6 animate-fadeIn select-none">
          {/* Close Button */}
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-colors z-70 backdrop-blur-md border border-white/20 shadow-lg active:scale-95"
            title="Đóng toàn màn hình"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Slide Counter in Fullscreen */}
          {slides.length > 1 && (
            <div className="absolute top-4 left-4 z-70 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90 shadow-lg">
              {activeSlideIndex + 1} / {slides.length}
            </div>
          )}

          {/* Fullscreen Prev Button */}
          {slides.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
              className="absolute left-2.5 sm:left-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md border border-white/20 z-70 transition-all active:scale-95 shadow-xl"
              title="Ảnh/video trước"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Fullscreen Next Button */}
          {slides.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
              className="absolute right-2.5 sm:right-6 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center backdrop-blur-md border border-white/20 z-70 transition-all active:scale-95 shadow-xl"
              title="Ảnh/video tiếp theo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          {/* Main Fullscreen Media Content */}
          <div className="relative w-full max-w-5xl h-[60vh] sm:h-[75vh] md:h-auto md:aspect-video max-h-[88vh] rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center bg-black">
            {isMediaVideo(currentSlide) ? (
              <VideoSlidePlayer url={currentSlide.url} title={currentSlide.title || location.title} isFullscreen={true} />
            ) : (
              <img
                src={currentSlide.url}
                alt={currentSlide.title || location.title}
                className="max-w-full max-h-[88vh] object-contain rounded-xl shadow-2xl"
                referrerPolicy="no-referrer"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
