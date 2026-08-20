import React, { useState, useEffect } from 'react';
import { LocationItem } from '../types';
import { globalAudioNarrator } from '../utils/speechUtils';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize, 
  Volume2, 
  VolumeX, 
  Clock, 
  MapPin, 
  Users, 
  Eye, 
  CheckCircle2, 
  ExternalLink, 
  Phone, 
  Share2,
  Navigation,
  Sparkles,
  Play,
  Pause,
  Square,
  Loader2,
  Radio,
  Sliders,
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
  const [activeEngine, setActiveEngine] = useState<'ai' | 'web' | null>(null);
  const [showAudioPanel, setShowAudioPanel] = useState(false);

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
    setActiveEngine(null);
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

  // Start or toggle AI audio speech narration
  const handleTogglePlayAudio = async () => {
    if (isPlaying) {
      if (isPaused) {
        globalAudioNarrator.resume();
        setIsPaused(false);
      } else {
        globalAudioNarrator.pause();
        setIsPaused(true);
      }
      return;
    }

    const narrationText = location.description;
    
    setIsLoadingAudio(true);
    setShowAudioPanel(true);

    const result = await globalAudioNarrator.speak({
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

    setActiveEngine(result.type);
  };

  const handleStopAudio = () => {
    globalAudioNarrator.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setIsLoadingAudio(false);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#2D3748]">
        
        {/* Modal Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FDFCFB] border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-[#C5A059] text-white font-extrabold text-sm flex items-center justify-center shadow-md">
              #{location.code}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-blue-50 text-[#1A365D] text-[10px] font-bold uppercase tracking-widest rounded">
                  Luxury Zone
                </span>
                {activeEngine && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold rounded flex items-center gap-1 border border-emerald-200">
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {activeEngine === 'ai' ? 'Giọng AI Gemini' : 'Giọng Chuẩn Vi-VN'}
                  </span>
                )}
              </div>
              <h2 className="text-xl md:text-2xl font-serif font-bold text-[#1A365D] leading-tight mt-0.5">
                {location.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Guide Quick Toggle Button */}
            <button
              onClick={() => {
                setShowAudioPanel((prev) => !prev);
                if (!isPlaying && !showAudioPanel) {
                  handleTogglePlayAudio();
                }
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs ${
                isPlaying
                  ? 'bg-amber-500 text-white animate-pulse shadow-md'
                  : showAudioPanel
                  ? 'bg-[#1A365D] text-white'
                  : 'bg-[#F7FAFC] hover:bg-amber-50 text-[#1A365D] border border-gray-200'
              }`}
              title="Thuyết minh giọng nói Tiếng Việt chuẩn AI"
            >
              <Volume2 className={`w-4 h-4 ${isPlaying ? 'text-white' : 'text-[#C5A059]'}`} />
              <span className="hidden sm:inline">
                {isLoadingAudio ? 'Đang tạo audio...' : isPlaying ? 'Đang phát AI...' : 'Thuyết Minh AI'}
              </span>
            </button>

            {/* Share Link Button */}
            <button
              onClick={handleCopyLink}
              className="p-2 rounded-xl bg-[#F7FAFC] hover:bg-gray-100 text-gray-600 border border-gray-200 transition-colors"
              title="Sao chép liên kết chia sẻ"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Close Modal Button */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#F7FAFC] hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI AUDIO NARRATION CONTROL PANEL (Expandable Bar) */}
        {showAudioPanel && (
          <div className="bg-slate-900 text-white p-4 border-b border-slate-800 space-y-3 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              
              {/* Play / Pause / Stop Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleTogglePlayAudio}
                  disabled={isLoadingAudio}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-[#C5A059] hover:bg-[#B38E47] text-white font-bold transition-transform active:scale-95 disabled:opacity-50 shadow-md"
                >
                  {isLoadingAudio ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isPlaying && !isPaused ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                {isPlaying && (
                  <button
                    onClick={handleStopAudio}
                    className="p-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-gray-300 transition-colors"
                    title="Dừng thuyết minh"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                )}

                {/* Animated Soundwave Visualizer */}
                {isPlaying && !isPaused && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/60">
                    <span className="w-1 h-3 bg-[#C5A059] rounded-full animate-bounce"></span>
                    <span className="w-1 h-5 bg-[#C5A059] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1 h-2 bg-[#C5A059] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    <span className="w-1 h-4 bg-[#C5A059] rounded-full animate-bounce [animation-delay:0.1s]"></span>
                    <span className="text-[11px] text-amber-300 font-semibold ml-1">Đang thuyết minh...</span>
                  </div>
                )}

                {isLoadingAudio && (
                  <span className="text-xs text-amber-200 animate-pulse font-medium">
                    ✨ Gemini AI đang tạo bài đọc truyền cảm...
                  </span>
                )}
              </div>

              {/* Voice & Speed Selectors */}
              <div className="flex flex-wrap items-center gap-3 text-xs w-full sm:w-auto justify-between sm:justify-end">
                {/* Voice Selection - Removed as it uses the globally configured voice from Admin */}

                {/* Speed Selection */}
                <div className="flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                  <span className="text-gray-400 text-[11px] mr-1 font-medium">Tốc độ:</span>
                  {[0.85, 1.0, 1.15].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setSpeechRate(rate)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                        speechRate === rate
                          ? 'bg-amber-400 text-slate-950'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {rate === 0.85 ? '0.8x' : rate === 1.0 ? '1.0x' : '1.2x'}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* SLIDE IMAGE CAROUSEL SECTION */}
          <div className="relative group w-full aspect-video rounded-2xl overflow-hidden bg-black border border-gray-200 shadow-md flex items-center justify-center">
            {(() => {
              const isVideo = currentSlide.mediaType === 'video';
              const isYouTube = isVideo && (currentSlide.url.includes('youtube.com') || currentSlide.url.includes('youtu.be'));
              let ytId = '';
              if (isYouTube) {
                 const match = currentSlide.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                 if (match) ytId = match[1];
              }
              if (isVideo) {
                 if (isYouTube && ytId) {
                   return (
                     <iframe
                       src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&playlist=${ytId}`}
                       title="YouTube video player"
                       frameBorder="0"
                       allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                       allowFullScreen
                       className="w-full h-full"
                     ></iframe>
                   );
                 }
                 return (
                   <video src={currentSlide.url} controls autoPlay muted loop className="w-full h-full object-contain" />
                 );
              }
              return (
                <img
                  src={currentSlide.url}
                  alt={currentSlide.title || location.title}
                  className="w-full h-full object-cover transition-all duration-500"
                  referrerPolicy="no-referrer"
                />
              );
            })()}
            
            {/* Image Gradient Dark Overlay for Caption readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />

            {/* Slide Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button
                  onClick={handlePrevSlide}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-white text-[#1A365D] border border-gray-200 shadow-lg backdrop-blur-md transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextSlide}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-white/80 hover:bg-white text-[#1A365D] border border-gray-200 shadow-lg backdrop-blur-md transition-all hover:scale-110"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Lightbox Fullscreen Button */}
            <button
              onClick={() => setIsLightboxOpen(true)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-white/80 hover:bg-white text-[#1A365D] border border-gray-200 shadow-md backdrop-blur-md transition-all"
              title="Xem ảnh phóng to"
            >
              <Maximize className="w-4 h-4" />
            </button>

            {/* Active Slide Info & Indicators */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
              <div>
                {currentSlide.title && (
                  <h3 className="text-sm font-serif font-bold text-white drop-shadow-md">
                    {currentSlide.title}
                  </h3>
                )}
                {currentSlide.caption && (
                  <p className="text-xs text-gray-200 drop-shadow-md line-clamp-1">
                    {currentSlide.caption}
                  </p>
                )}
              </div>

              {/* Slide Counter Badge */}
              {slides.length > 1 && (
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-gray-200 text-xs font-bold text-[#1A365D] shadow-sm">
                  {activeSlideIndex + 1} / {slides.length}
                </span>
              )}
            </div>
          </div>

          {/* Slide Thumbnails Row */}
          {slides.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
              {slides.map((slide, idx) => {
                const isVideo = slide.mediaType === 'video';
                const isYouTube = isVideo && (slide.url.includes('youtube.com') || slide.url.includes('youtu.be'));
                let ytId = '';
                if (isYouTube) {
                   const match = slide.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                   if (match) ytId = match[1];
                }
                
                return (
                <button
                  key={slide.id || idx}
                  onClick={() => setActiveSlideIndex(idx)}
                  className={`relative flex-shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all bg-gray-900 ${
                    activeSlideIndex === idx
                      ? 'border-[#1A365D] ring-2 ring-[#1A365D]/30 scale-105'
                      : 'border-gray-200 opacity-60 hover:opacity-100'
                  }`}
                >
                  {isVideo ? (
                    isYouTube && ytId ? (
                      <img src={`https://img.youtube.com/vi/${ytId}/default.jpg`} className="w-full h-full object-cover opacity-80" />
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
                      <Video className="w-4 h-4 text-white" />
                    </div>
                  )}
                </button>
              )})}
            </div>
          )}

          {/* Key Specs Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#F7FAFC] border border-gray-100">
            {location.openingHours && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Giờ hoạt động</p>
                  <p className="text-xs font-bold text-[#1A365D]">{location.openingHours}</p>
                </div>
              </div>
            )}

            {location.capacity && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Sức chứa / Quy mô</p>
                  <p className="text-xs font-bold text-[#1A365D]">{location.capacity}</p>
                </div>
              </div>
            )}

            {location.viewType && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                  <Eye className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Hướng nhìn (View)</p>
                  <p className="text-xs font-bold text-[#1A365D]">{location.viewType}</p>
                </div>
              </div>
            )}

            {location.distanceFromLobby && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 font-bold">
                  <Navigation className="w-5 h-5 text-purple-600" />
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

              {!showAudioPanel && (
                <button
                  type="button"
                  onClick={handleTogglePlayAudio}
                  className="text-[11px] text-[#C5A059] hover:underline font-bold flex items-center gap-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Nghe Giọng Đọc AI</span>
                </button>
              )}
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
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#C5A059]" />
            <span className="text-xs text-gray-600">Lễ Tân / Đặt phòng: <strong className="text-[#1A365D]">{hotline}</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-3 rounded-xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 text-xs font-bold transition-colors shadow-xs"
            >
              Đóng
            </button>
            
            <a
              href={location.bookingLink || `tel:${hotline}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-[#C5A059] hover:bg-[#B38E47] text-white font-bold text-xs shadow-lg hover:shadow-xl transition-all"
            >
              <span className="uppercase">{getCtaText()}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

      </div>

      {/* Lightbox Fullscreen Popup */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentSlide.url}
            alt={currentSlide.title || location.title}
            className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
};

