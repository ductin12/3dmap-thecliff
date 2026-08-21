import React, { useState } from 'react';
import { LocationItem, ResortConfig, CategoryType, SlideImage, TourConfig } from '../types';
import { AdminTourTab } from './AdminTourTab';
import { WordPressEmbedContent } from './WordPressEmbedContent';
import { 
  X, 
  Plus, 
  Trash2, 
  Save, 
  MapPin, 
  Upload, 
  RotateCcw, 
  Download, 
  Lock, 
  Unlock, 
  Sparkles,
  Check,
  Image as ImageIcon,
  Sliders,
  Globe,
  Volume2,
  Music,
  Mic,
  Headphones,
  Radio,
  CloudSun,
  Code,
  Copy,
  Video,
  Folder,
  FolderOpen,
  FileImage,
  Layers,
  Film
} from 'lucide-react';

interface AdminPanelProps {
  locations: LocationItem[];
  resortConfig: ResortConfig;
  onSaveAll: (locs: LocationItem[], cfg: ResortConfig) => void;
  onResetToDefault: () => void;
  isFullScreen?: boolean;
  userRole?: string;
  onClose: () => void;
  onStartPinCalibration: (locationId: string) => void;
  calibratingLocationId: string | null;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  locations,
  resortConfig,
  onSaveAll,
  onResetToDefault,
  onClose,
  onStartPinCalibration,
  isFullScreen,
  userRole,
  calibratingLocationId,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'locations' | 'slides' | 'settings' | 'tour' | 'wordpress' | 'backup'>('locations');
  
  // Active selected location ID for editing
  const [selectedLocId, setSelectedLocId] = useState<string>(locations[0]?.id || '');

  // Local state for edits
  const [locList, setLocList] = useState<LocationItem[]>(locations);
  const [cfg, setCfg] = useState<ResortConfig>(resortConfig);
  
  const [scrapeRoomUrl, setScrapeRoomUrl] = useState('');
  const [isScrapingRoom, setIsScrapingRoom] = useState(false);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [ttsVoices, setTtsVoices] = useState<{id: string, name: string}[]>([]);
  
  // Drag and Drop State for Slides
  const [draggedSlideIdx, setDraggedSlideIdx] = useState<number | null>(null);

  // Google Drive Import States
  const [isScanningDrive, setIsScanningDrive] = useState(false);
  const [isImportingDrive, setIsImportingDrive] = useState(false);
  const [driveImportProgress, setDriveImportProgress] = useState('');
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [driveScanResult, setDriveScanResult] = useState<{
    folderName: string;
    totalFiles: number;
    totalImages: number;
    totalVideos: number;
    images: Array<{ id: string; name: string; type: string; thumbnailUrl: string }>;
    videos: Array<{ id: string; name: string; type: string; thumbnailUrl: string }>;
  } | null>(null);
  const [selectedDriveIds, setSelectedDriveIds] = useState<string[]>([]);

  React.useEffect(() => {
    if (locations && locations.length > 0) {
      setLocList(locations);
      if (!selectedLocId || !locations.some(l => l.id === selectedLocId)) {
        setSelectedLocId(locations[0]?.id || '');
      }
    }
  }, [locations]);

  React.useEffect(() => {
    if (resortConfig) {
      setCfg(resortConfig);
    }
  }, [resortConfig]);

  React.useEffect(() => {
    fetch('https://tts.thecliff.io.vn/voices')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setTtsVoices(data);
      })
      .catch(err => console.error("Failed to fetch TTS voices:", err));
  }, []);

  const currentLoc = locList.find((l) => l.id === selectedLocId) || locList[0];

  const handleUpdateCurrentLoc = (field: keyof LocationItem, value: any) => {
    if (!currentLoc) return;
    const updated = locList.map((loc) => {
      if (loc.id === currentLoc.id) {
        return { ...loc, [field]: value };
      }
      return loc;
    });
    setLocList(updated);
  };

  const handleAddSlideImage = (url: string, title?: string, mediaType?: 'image' | 'video') => {
    if (!currentLoc || !url) return;
    
    // Auto-detect mediaType if not explicitly provided
    let detectedMediaType = mediaType || 'image';
    if (!mediaType) {
       const urlLower = url.toLowerCase();
       if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.match(/\.(mp4|webm|ogg)$/)) {
         detectedMediaType = 'video';
       } else if (urlLower.startsWith('data:video/')) {
         detectedMediaType = 'video';
       }
    }

    const newSlide: SlideImage = {
      id: `img-${Date.now()}`,
      url: url.trim(),
      title: title || currentLoc.title,
      caption: '',
      mediaType: detectedMediaType
    };
    const updatedLocs = locList.map((loc) => {
      if (loc.id === currentLoc.id) {
        return {
          ...loc,
          images: [...(loc.images || []), newSlide]
        };
      }
      return loc;
    });
    setLocList(updatedLocs);
  };

  // Handle URL input submit (handles standard URLs and Google Drive URLs)
  const handleAddImageUrlClick = async (inputUrl: string) => {
    if (!inputUrl || !inputUrl.trim()) return;
    const trimmed = inputUrl.trim();

    // Detect Google Drive Folder or File URL
    const isDriveUrl = 
      trimmed.includes('drive.google.com') || 
      trimmed.includes('/folders/') || 
      trimmed.includes('/file/d/') ||
      trimmed.includes('drive.google.com/open?id=');

    if (isDriveUrl) {
      setIsScanningDrive(true);
      try {
        const res = await fetch('/api/gdrive/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = await res.json();
        if (data.success) {
          setDriveScanResult(data);
          const allIds = [
            ...(data.images || []).map((i: any) => i.id),
            ...(data.videos || []).map((v: any) => v.id),
          ];
          setSelectedDriveIds(allIds);
          setShowDriveModal(true);
        } else {
          alert(data.error || 'Không thể quét thư mục Google Drive. Vui lòng đảm bảo thư mục đã được bật chia sẻ "Bất kỳ ai có liên kết đều có thể xem".');
        }
      } catch (err: any) {
        console.error('GDrive Scan Error:', err);
        alert('Lỗi kết nối khi quét Google Drive: ' + err.message);
      } finally {
        setIsScanningDrive(false);
      }
      return;
    }

    // Direct image / video / YouTube link
    handleAddSlideImage(trimmed);
  };

  // Toggle individual item in Google Drive selection
  const toggleDriveItemSelection = (id: string) => {
    setSelectedDriveIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk selection helper methods
  const selectAllDriveItems = () => {
    if (!driveScanResult) return;
    const allIds = [
      ...driveScanResult.images.map((i) => i.id),
      ...driveScanResult.videos.map((v) => v.id),
    ];
    setSelectedDriveIds(allIds);
  };

  const deselectAllDriveItems = () => {
    setSelectedDriveIds([]);
  };

  const invertDriveSelection = () => {
    if (!driveScanResult) return;
    const allIds = [
      ...driveScanResult.images.map((i) => i.id),
      ...driveScanResult.videos.map((v) => v.id),
    ];
    setSelectedDriveIds(allIds.filter((id) => !selectedDriveIds.includes(id)));
  };

  const selectAllDriveImages = () => {
    if (!driveScanResult) return;
    const imgIds = driveScanResult.images.map((i) => i.id);
    setSelectedDriveIds((prev) => Array.from(new Set([...prev, ...imgIds])));
  };

  const deselectAllDriveImages = () => {
    if (!driveScanResult) return;
    const imgIds = new Set(driveScanResult.images.map((i) => i.id));
    setSelectedDriveIds((prev) => prev.filter((id) => !imgIds.has(id)));
  };

  const selectFirstNDriveImages = (count: number) => {
    if (!driveScanResult) return;
    const nImgs = driveScanResult.images.slice(0, count).map((i) => i.id);
    const nonImageIds = selectedDriveIds.filter(
      (id) => !driveScanResult.images.some((img) => img.id === id)
    );
    setSelectedDriveIds([...nonImageIds, ...nImgs]);
  };

  const selectAllDriveVideos = () => {
    if (!driveScanResult) return;
    const vidIds = driveScanResult.videos.map((v) => v.id);
    setSelectedDriveIds((prev) => Array.from(new Set([...prev, ...vidIds])));
  };

  const deselectAllDriveVideos = () => {
    if (!driveScanResult) return;
    const vidIds = new Set(driveScanResult.videos.map((v) => v.id));
    setSelectedDriveIds((prev) => prev.filter((id) => !vidIds.has(id)));
  };

  const selectFirstNDriveVideos = (count: number) => {
    if (!driveScanResult) return;
    const nVids = driveScanResult.videos.slice(0, count).map((v) => v.id);
    const nonVideoIds = selectedDriveIds.filter(
      (id) => !driveScanResult.videos.some((vid) => vid.id === id)
    );
    setSelectedDriveIds([...nonVideoIds, ...nVids]);
  };

  // Confirm Import from Google Drive
  const handleConfirmDriveImport = async () => {
    if (!driveScanResult || !currentLoc) return;

    const selectedImages = (driveScanResult.images || []).filter((i) =>
      selectedDriveIds.includes(i.id)
    );
    const selectedVideos = (driveScanResult.videos || []).filter((v) =>
      selectedDriveIds.includes(v.id)
    );
    const itemsToImport = [...selectedImages, ...selectedVideos];

    if (itemsToImport.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ảnh hoặc 1 video để nhập.');
      return;
    }

    setIsImportingDrive(true);
    setDriveImportProgress(`Đang tải và lưu ${itemsToImport.length} tệp từ Google Drive về kho ảnh...`);

    try {
      const res = await fetch('/api/gdrive/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToImport }),
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.slides)) {
        const updatedLocs = locList.map((loc) => {
          if (loc.id === currentLoc.id) {
            return {
              ...loc,
              images: [...(loc.images || []), ...data.slides],
            };
          }
          return loc;
        });
        setLocList(updatedLocs);
        onSaveAll(updatedLocs, cfg);
        setShowDriveModal(false);
        setDriveScanResult(null);
        setSelectedDriveIds([]);
        alert(`Đã nhập thành công và lưu ${data.slides.length} ảnh/video vào Slide của ${currentLoc.title}! Dữ liệu đã được tự động lưu.`);
      } else {
        alert(data.error || 'Lỗi khi nhập tệp từ Google Drive.');
      }
    } catch (err: any) {
      console.error('GDrive Import Error:', err);
      alert('Lỗi khi nhập tệp từ Google Drive: ' + err.message);
    } finally {
      setIsImportingDrive(false);
      setDriveImportProgress('');
    }
  };

  const handleDeleteSlideImage = (slideId: string) => {
    if (!currentLoc) return;
    const updatedLocs = locList.map((loc) => {
      if (loc.id === currentLoc.id) {
        return {
          ...loc,
          images: loc.images.filter((img) => img.id !== slideId)
        };
      }
      return loc;
    });
    setLocList(updatedLocs);
  };

  const handleScrapeRoomUrl = async () => {
    if (!currentLoc) return;
    if (!scrapeRoomUrl || !scrapeRoomUrl.includes("thecliffresort.com.vn")) {
      alert("Vui lòng nhập đúng đường dẫn phòng từ thecliffresort.com.vn");
      return;
    }

    setIsScrapingRoom(true);
    try {
      const res = await fetch("/api/scrape-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: scrapeRoomUrl }),
      });
      const data = await res.json();
      if (data.success && data.urls) {
        const replaceAll = window.confirm(
          `Tìm thấy ${data.urls.length} ảnh/video. Bạn muốn GHI ĐÈ lên toàn bộ ảnh hiện tại? Bấm OK để GHI ĐÈ, bấm Cancel để NỐI THÊM ảnh mới vào danh sách cũ.`
        );

        const newSlides = data.urls.map((url: string, index: number) => {
          const isVideo = url.includes("youtube.com") || url.includes("youtu.be");
          return {
            id: `img-${Date.now()}-${index}`,
            url: url,
            title: currentLoc.title,
            caption: "",
            mediaType: isVideo ? "video" : "image",
          };
        });

        const updatedLocs = locList.map((loc) => {
          if (loc.id === currentLoc.id) {
            return {
              ...loc,
              images: replaceAll ? newSlides : [...(loc.images || []), ...newSlides],
            };
          }
          return loc;
        });
        setLocList(updatedLocs);
        setScrapeRoomUrl("");
        alert("Lấy dữ liệu ảnh/video thành công!");
      } else {
        alert("Không tìm thấy ảnh nào hoặc có lỗi xảy ra: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      alert("Lỗi khi quét ảnh: " + err.message);
    } finally {
      setIsScrapingRoom(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const base64Url = uploadEvent.target?.result as string;
        if (base64Url) {
          handleAddSlideImage(base64Url, file.name.split('.')[0], isVideo ? 'video' : 'image');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Helper to compress map background images for reliable client & serverless display
  const compressMapImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 2048;
          const maxHeight = 2048;
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(e.target?.result as string);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);

          try {
            const dataUrl = canvas.toDataURL('image/webp', 0.88);
            resolve(dataUrl);
          } catch {
            try {
              const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
              resolve(dataUrl);
            } catch {
              resolve(e.target?.result as string);
            }
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleMapBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedDataUrl = await compressMapImageFile(file);
      const newCfg = { ...cfg, mapImageBg: compressedDataUrl };
      setCfg(newCfg);
      onSaveAll(locList, newCfg);

      // Attempt server storage if on Node/Docker
      fetch('/api/upload-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64Data: compressedDataUrl })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url && !window.location.hostname.includes('vercel.app')) {
            const serverCfg = { ...cfg, mapImageBg: data.url };
            setCfg(serverCfg);
            onSaveAll(locList, serverCfg);
          }
        })
        .catch(() => {});

      alert("Đã cập nhật và lưu ảnh bản đồ mới thành công!");
    } catch (error: any) {
      console.error("Map upload error:", error);
      alert("Lỗi khi tải ảnh bản đồ: " + error.message);
    }
  };

  const handleAddNewLocation = () => {
    const newId = `loc-${Date.now()}`;
    const newLocation: LocationItem = {
      id: newId,
      code: `${locList.length + 1}`,
      title: "Khu vực mới",
      subtitle: "Mô tả ngắn khu vực mới",
      category: "accommodation",
      x: 50,
      y: 50,
      description: "Nhập thông tin chi tiết khu vực tại đây...",
      highlights: ["Tiện ích nổi bật 1", "Tiện ích nổi bật 2"],
      images: [
        {
          id: `img-${Date.now()}`,
          url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop",
          title: "Khu vực mới"
        }
      ],
      amenities: ["Wifi", "Máy lạnh"]
    };

    setLocList([...locList, newLocation]);
    setSelectedLocId(newId);
  };

  const handleDuplicateLocation = (locToDuplicate: LocationItem) => {
    const newId = `loc-${Date.now()}`;
    const newLocation: LocationItem = {
      ...locToDuplicate,
      id: newId,
      code: `${locToDuplicate.code} (Copy)`,
      title: `${locToDuplicate.title} (Copy)`,
      images: locToDuplicate.images ? locToDuplicate.images.map(img => ({ ...img, id: `img-${Date.now()}-${Math.floor(Math.random() * 1000)}` })) : []
    };
    setLocList([...locList, newLocation]);
    setSelectedLocId(newId);
  };

  const handleDeleteLocation = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa khu vực này khỏi bản đồ?")) {
      const filtered = locList.filter(l => l.id !== id);
      setLocList(filtered);
      if (selectedLocId === id) {
        setSelectedLocId(filtered[0]?.id || '');
      }
    }
  };

  const handleSaveAll = async () => {
    onSaveAll(locList, cfg);
    
    // Pre-generate audio ONLY for changed/new locations and tour steps
    const textsToGenerate: { id: string; text: string }[] = [];
    
    // Collect location narrations (only if text changed)
    locList.forEach(loc => {
      if (loc.description) {
         const newText = loc.description || '';
         
         const oldLoc = locations.find(l => l.id === loc.id);
         let oldText = '';
         if (oldLoc && oldLoc.description) {
           oldText = oldLoc.description;
         }
         
         if (!oldLoc || newText !== oldText) {
           textsToGenerate.push({ id: loc.id, text: newText });
         }
      }
    });
    
    // Collect tour step narrations (only if script changed)
    cfg.tourConfig?.steps?.forEach(step => {
       if (step.narrationScript) {
          const oldStep = resortConfig.tourConfig?.steps?.find(s => s.locationId === step.locationId);
          if (!oldStep || oldStep.narrationScript !== step.narrationScript) {
            textsToGenerate.push({ id: `tour-${step.locationId}`, text: step.narrationScript });
          }
       }
    });

    const defaultVoiceStyle = cfg.defaultVoiceStyle || 'female_ai';
    if (defaultVoiceStyle !== 'web_natural' && textsToGenerate.length > 0) {
      // Send changed items to backend for background TTS generation
      fetch('/api/tts/scan', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ texts: textsToGenerate, voice_id: defaultVoiceStyle })
      }).catch(e => console.warn('Failed to start background TTS scan', e));
    }

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ locations: locList, config: cfg }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `the_cliff_map_config_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (json.locations && Array.isArray(json.locations)) {
            setLocList(json.locations);
          }
          if (json.config) {
            setCfg(json.config);
          }
          alert("Nhập cấu hình dữ liệu JSON thành công!");
        } catch (err) {
          alert("Lỗi file JSON không hợp lệ.");
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className={isFullScreen ? "w-full h-full flex flex-col bg-white" : "fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/50 backdrop-blur-sm animate-fadeIn"}>
    <div className={isFullScreen ? "relative w-full h-full flex flex-col text-[#2D3748] max-w-6xl mx-auto" : "relative w-full max-w-5xl h-[90vh] bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#2D3748]"}>
        
        {/* Admin Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#FDFCFB] border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1A365D] text-white flex items-center justify-center shadow-md">
              <Sliders className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <span className="px-2 py-0.5 bg-blue-50 text-[#1A365D] text-[10px] font-bold uppercase tracking-widest rounded">
                Admin Control
              </span>
              <h2 className="text-lg md:text-xl font-serif font-bold text-[#1A365D]">
                Quản Lý Bản Đồ 3D - The Cliff Resort
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {savedSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <Check className="w-4 h-4 text-emerald-600" /> Đã lưu thành công!
              </span>
            )}

            
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#1A365D] hover:bg-[#2A4365] text-white font-bold text-xs shadow-md transition-all"
              title="Export all data to JSON"
            >
              <Download className="w-4 h-4" />
              <span>Export Data</span>
            </button>

            <label className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-600 hover:bg-gray-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Import Data</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={handleSaveAll}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38E47] text-white font-bold text-xs shadow-md transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cấu Hình</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-[#F7FAFC] hover:bg-gray-200 text-gray-600 border border-gray-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 px-6 py-3 bg-[#F7FAFC] border-b border-gray-100 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('locations')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'locations' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            📍 Quản Lý Khu Vực & Ghim Pin
          </button>
          <button
            onClick={() => setActiveTab('slides')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'slides' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            🖼️ Quản Lý Slide Ảnh Chi Tiết
          </button>
          <button
            onClick={() => setActiveTab('tour')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'tour' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            🗺️ Tour Tham Quan Gợi Ý
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            ⚙️ Cấu Hình Resort & Thời Tiết
          </button>
          <button
            onClick={() => setActiveTab('wordpress')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'wordpress' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            💻 Tích Hợp WordPress
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'backup' ? 'bg-[#1A365D] text-white shadow-sm' : 'bg-white hover:bg-gray-100 text-gray-600 border border-gray-200'
            }`}
          >
            💾 Backup
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* TAB 1: LOCATION & PIN MANAGER */}
          {activeTab === 'locations' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Location Selection List */}
              <div className="space-y-3 bg-[#F7FAFC] p-4 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-[#1A365D]">Chọn Khu Vực Edit</h3>
                  <button
                    onClick={handleAddNewLocation}
                    className="flex items-center gap-1 text-xs text-[#C5A059] hover:underline font-bold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm khu mới
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                  {locList.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => setSelectedLocId(loc.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        selectedLocId === loc.id
                          ? 'bg-[#1A365D] border-[#1A365D] text-white font-bold shadow-xs'
                          : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`px-1.5 py-0.5 rounded font-extrabold text-[10px] ${selectedLocId === loc.id ? 'bg-[#C5A059] text-white' : 'bg-red-500 text-white'}`}>
                          #{loc.code}
                        </span>
                        <span className="truncate">{loc.title}</span>
                      </div>
                      <span className={`text-[10px] ${selectedLocId === loc.id ? 'text-gray-300' : 'text-gray-400'}`}>
                        ({loc.x}%, {loc.y}%)
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Editing Form */}
              {currentLoc && (
                <div className="lg:col-span-2 space-y-4 bg-[#FDFCFB] p-5 rounded-2xl border border-gray-100 shadow-xs">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <h3 className="font-serif font-bold text-base text-[#1A365D] flex items-center gap-2">
                      <span>Chỉnh sửa: #{currentLoc.code} - {currentLoc.title}</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDuplicateLocation(currentLoc)}
                        className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                        title="Nhân bản khu vực này (Duplicate)"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          onStartPinCalibration(currentLoc.id);
                          onClose();
                        }}
                        className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          calibratingLocationId === currentLoc.id
                            ? 'bg-[#C5A059] text-white animate-bounce'
                            : 'bg-[#F7FAFC] hover:bg-gray-200 text-[#1A365D] border border-gray-200'
                        }`}
                        title="Click vào hình map để định vị điểm ghim X%, Y%"
                      >
                        <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
                        <span>Chấm điểm trên Map</span>
                      </button>
                      <button
                        onClick={() => handleDeleteLocation(currentLoc.id)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                        title="Xóa khu vực này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Mã Số Pin trên Map (Code)</label>
                      <input
                        type="text"
                        value={currentLoc.code}
                        onChange={(e) => handleUpdateCurrentLoc('code', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Phân Loại (Category)</label>
                      <select
                        value={currentLoc.category}
                        onChange={(e) => handleUpdateCurrentLoc('category', e.target.value as CategoryType)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                      >
                        <option value="accommodation">🛏️ Lưu Trú & Villa</option>
                        <option value="pool_beach">🏊 Hồ Bơi & Biển</option>
                        <option value="dining">🍽️ Ẩm Thực</option>
                        <option value="spa_wellness">🧘 Spa & Trị Liệu</option>
                        <option value="recreation">🎮 Giải Trí & Thể Thao</option>
                        <option value="facility">🏛️ Tiện Ích & Dịch Vụ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Tên Khu Vực (Tiêu đề chính)</label>
                      <input
                        type="text"
                        value={currentLoc.title}
                        onChange={(e) => handleUpdateCurrentLoc('title', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Tên Phụ (Subtitle)</label>
                      <input
                        type="text"
                        value={currentLoc.subtitle || ''}
                        onChange={(e) => handleUpdateCurrentLoc('subtitle', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                      />
                    </div>

                    {/* Manual Pin Coordinates Adjustment */}
                    <div>
                      <label className="block text-gray-700 font-bold mb-1">
                        Tọa độ X (%) trên Map: <strong className="text-[#C5A059]">{currentLoc.x}%</strong>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={currentLoc.x}
                        onChange={(e) => handleUpdateCurrentLoc('x', parseFloat(e.target.value))}
                        className="w-full accent-[#1A365D]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">
                        Tọa độ Y (%) trên Map: <strong className="text-[#C5A059]">{currentLoc.y}%</strong>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={currentLoc.y}
                        onChange={(e) => handleUpdateCurrentLoc('y', parseFloat(e.target.value))}
                        className="w-full accent-[#1A365D]"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Giờ Hoạt Động</label>
                      <input
                        type="text"
                        value={currentLoc.openingHours || ''}
                        onChange={(e) => handleUpdateCurrentLoc('openingHours', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                        placeholder="VD: 06:00 - 22:00"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Sức Chứa / Quy Mô</label>
                      <input
                        type="text"
                        value={currentLoc.capacity || ''}
                        onChange={(e) => handleUpdateCurrentLoc('capacity', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                        placeholder="VD: 2 - 4 Khách"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Khoảng Cách từ Sảnh</label>
                      <input
                        type="text"
                        value={currentLoc.distanceFromLobby || ''}
                        onChange={(e) => handleUpdateCurrentLoc('distanceFromLobby', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                        placeholder="VD: 50m - 1 phút đi bộ"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 font-bold mb-1">Link Đặt Phòng / Giữ Bàn</label>
                      <input
                        type="text"
                        value={currentLoc.bookingLink || ''}
                        onChange={(e) => handleUpdateCurrentLoc('bookingLink', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                        placeholder="https://thecliffresort.com.vn/booking"
                      />
                    </div>

                    <div className="sm:col-span-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-[#1A365D] font-bold text-xs flex items-center gap-1.5">
                          <span>Tên Nút CTA (Nút Đặt / Nút Tương Tác)</span>
                        </label>
                        <span className="text-[10px] text-amber-800 font-medium">Tùy chỉnh nhãn nút khi khách bấm xem chi tiết</span>
                      </div>
                      
                      <input
                        type="text"
                        value={currentLoc.bookingCtaText || ''}
                        onChange={(e) => handleUpdateCurrentLoc('bookingCtaText', e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none font-medium"
                        placeholder="VD: Đặt Phòng Ngay, Đặt Bàn Ngay, Book Lịch Spa, Xem Thực Đơn..."
                      />

                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-gray-500 font-medium">Gợi ý nhanh:</span>
                        {[
                          'Đặt Phòng Ngay',
                          'Đặt Bàn Ngay',
                          'Book Lịch Spa',
                          'Xem Thực Đơn',
                          'Đặt Dịch Vụ',
                          'Liên Hệ Lễ Tân'
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => handleUpdateCurrentLoc('bookingCtaText', preset)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${
                              currentLoc.bookingCtaText === preset
                                ? 'bg-[#1A365D] text-white'
                                : 'bg-white hover:bg-amber-100 text-[#1A365D] border border-amber-200'
                            }`}
                          >
                            + {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-xs">Mô Tả Chi Tiết Khu Vực</label>
                    <textarea
                      rows={3}
                      value={currentLoc.description}
                      onChange={(e) => handleUpdateCurrentLoc('description', e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs text-[#2D3748] focus:outline-none focus:border-[#1A365D]"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SLIDE IMAGES MANAGER */}
          {activeTab === 'slides' && currentLoc && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-[#F7FAFC] p-4 rounded-2xl border border-gray-100">
                <div>
                  <h3 className="font-serif font-bold text-sm text-[#1A365D]">
                    Slide Ảnh Chi Tiết Cho: #{currentLoc.code} - {currentLoc.title}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Thêm các hình ảnh độ phân giải cao để hiển thị khi người dùng click vào ghim #{currentLoc.code}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  {/* Local File Upload Button */}
                  <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-gray-100 text-[#1A365D] text-xs font-bold border border-gray-200 cursor-pointer transition-colors shadow-xs">
                    <Upload className="w-4 h-4 text-[#C5A059]" />
                    <span>Tải file (Ảnh / MP4) từ máy</span>
                    <input
                      type="file"
                      accept="image/*,video/mp4,video/webm"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Add Image by URL / YouTube / Google Drive Row */}
              <div className="p-4 bg-[#FDFCFB] rounded-2xl border border-gray-200 flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      id="newImageUrlInput"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const input = document.getElementById('newImageUrlInput') as HTMLInputElement;
                          if (input && input.value) {
                            handleAddImageUrlClick(input.value);
                            input.value = '';
                          }
                        }
                      }}
                      placeholder="Dán link ảnh URL, link YouTube hoặc link Thư mục Google Drive"
                      className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-[#2D3748] focus:outline-none focus:border-[#1A365D]"
                    />
                    <Folder className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                  </div>
                  <button
                    disabled={isScanningDrive}
                    onClick={() => {
                      const input = document.getElementById('newImageUrlInput') as HTMLInputElement;
                      if (input && input.value) {
                        handleAddImageUrlClick(input.value);
                        input.value = '';
                      }
                    }}
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1.5 justify-center shadow-md transition-all ${
                      isScanningDrive 
                        ? 'bg-[#1A365D]/80 cursor-wait' 
                        : 'bg-[#1A365D] hover:bg-[#122642]'
                    }`}
                  >
                    {isScanningDrive ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang quét Drive...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Thêm Ảnh URL</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span>Hỗ trợ: Link ảnh trực tiếp (JPG, PNG, WebP), video YouTube và <strong>Thư mục Google Drive</strong> (tự động quét & chọn số lượng ảnh/video để lưu vào data).</span>
                </div>
                
                {/* Scrape from Website Row */}
                <div className="flex flex-col sm:flex-row gap-3 mt-1 border-t border-gray-100 pt-3">
                  <input
                    type="text"
                    value={scrapeRoomUrl}
                    onChange={(e) => setScrapeRoomUrl(e.target.value)}
                    placeholder="Nhập link hạng phòng từ thecliffresort.com.vn (để tự động lấy ảnh và video)"
                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs text-[#2D3748] focus:outline-none focus:border-[#C5A059]"
                  />
                  <button
                    onClick={handleScrapeRoomUrl}
                    disabled={isScrapingRoom}
                    className={`px-5 py-2 rounded-xl text-white font-bold text-xs flex items-center gap-1 justify-center shadow-md transition-all ${
                      isScrapingRoom ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#C5A059] hover:bg-[#B38E47]'
                    }`}
                  >
                    {isScrapingRoom ? (
                      <span className="flex items-center gap-2">
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Đang quét...
                      </span>
                    ) : (
                      <>
                        <Download className="w-4 h-4" /> Quét Dữ Liệu Web
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Current Slides Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {currentLoc.images && currentLoc.images.length > 0 ? (
                  currentLoc.images.map((img, idx) => {
                    const isVideo = img.mediaType === 'video';
                    const isYouTube = isVideo && (img.url.includes('youtube.com') || img.url.includes('youtu.be'));
                    let ytId = '';
                    if (isYouTube) {
                      const match = img.url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&]{11})/);
                      if (match) ytId = match[1];
                    }
                    
                    return (
                    <div
                      key={img.id || idx}
                      draggable
                      onDragStart={(e) => {
                        setDraggedSlideIdx(idx);
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedSlideIdx === null || draggedSlideIdx === idx) return;
                        const newImages = [...currentLoc.images];
                        const draggedImage = newImages[draggedSlideIdx];
                        newImages.splice(draggedSlideIdx, 1);
                        newImages.splice(idx, 0, draggedImage);
                        handleUpdateCurrentLoc('images', newImages);
                        setDraggedSlideIdx(null);
                      }}
                      className={`relative group rounded-2xl overflow-hidden bg-white border shadow-sm flex flex-col cursor-move transition-all ${draggedSlideIdx === idx ? 'opacity-50 border-dashed border-[#1A365D]' : 'border-gray-200'}`}
                    >
                      <div className="w-full h-44 overflow-hidden bg-gray-900 relative">
                        {isVideo ? (
                           isYouTube && ytId ? (
                             <img src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`} alt="YouTube Video" className="w-full h-full object-cover" />
                           ) : (
                             <video src={img.url} className="w-full h-full object-cover" muted />
                           )
                        ) : (
                          <img
                            src={img.url}
                            alt={img.title || `Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
                            <Video className="w-10 h-10 text-white/80" />
                          </div>
                        )}
                      </div>
                      
                      <div className="p-3 bg-[#FDFCFB] flex-1 space-y-1.5 text-xs">
                        <span className="text-[10px] uppercase font-bold text-[#C5A059]">Slide #{idx + 1} {isVideo && '- VIDEO'}</span>
                        <input
                          type="text"
                          value={img.title || ''}
                          onChange={(e) => {
                            const updatedImages = currentLoc.images.map(i => i.id === img.id ? { ...i, title: e.target.value } : i);
                            handleUpdateCurrentLoc('images', updatedImages);
                          }}
                          placeholder="Tiêu đề ảnh..."
                          className="w-full px-2 py-1 bg-white border border-gray-200 rounded text-[#2D3748]"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteSlideImage(img.id)}
                        className="absolute top-2 right-2 p-2 rounded-xl bg-white/90 hover:bg-red-600 hover:text-white text-gray-700 transition-colors shadow-sm"
                        title="Xóa slide ảnh này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })
                ) : (
                  <div className="col-span-full py-12 text-center text-gray-400 text-xs">
                    Chưa có hình ảnh slide cho khu vực này. Hãy dán URL hoặc tải ảnh lên.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RESORT SETTINGS */}
          {activeTab === 'settings' && (
            <div className="max-w-2xl mx-auto space-y-5 bg-[#FDFCFB] p-6 rounded-2xl border border-gray-200 text-xs shadow-xs">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="font-serif font-bold text-sm text-[#1A365D]">
                  Thông Tin Chung Của Bản Đồ The Cliff Resort
                </h3>
                <p className="text-gray-500 text-[11px] mt-0.5">
                  Tùy chỉnh thông tin thương hiệu, liên hệ và hình ảnh sơ đồ mặt bằng bản đồ tổng thể.
                </p>
              </div>

              {/* Map Background Image Customization Section */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="block text-[#1A365D] font-bold text-xs flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[#C5A059]" />
                    <span>Hình Ảnh Nền Bản Đồ Resort (Map Image / Graphic)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setCfg({ ...cfg, mapImageBg: '/cliff-map.svg' })}
                    className="text-[11px] text-[#C5A059] hover:underline font-bold"
                  >
                    Dùng Bản Đồ Vector Mặc Định
                  </button>
                </div>

                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Thay đổi bức ảnh nền sơ đồ tổng thể cho Resort. Bạn có thể dán đường dẫn URL ảnh hoặc bấm nút <b>"Tải ảnh bản đồ từ máy"</b> để chọn file hình ảnh thực tế từ máy tính của bạn.
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={cfg.mapImageBg || ''}
                    onChange={(e) => {
                      let val = e.target.value;
                      // Auto-convert Google Drive file share URL to direct high-res CDN link
                      if (val.includes('drive.google.com/file/d/')) {
                        const match = val.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
                        if (match && match[1]) {
                          val = `https://lh3.googleusercontent.com/d/${match[1]}=w2048`;
                        }
                      }
                      setCfg({ ...cfg, mapImageBg: val });
                    }}
                    placeholder="Nhập đường dẫn URL ảnh bản đồ, link Google Drive hoặc bấm Tải ảnh từ máy"
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[#2D3748] focus:bg-white focus:border-[#1A365D] outline-none text-xs"
                  />
                  
                  <label className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#1A365D] hover:bg-[#2A4365] text-white font-bold cursor-pointer transition-all shadow-xs shrink-0">
                    <Upload className="w-4 h-4 text-[#C5A059]" />
                    <span>Tải ảnh từ máy tính</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleMapBgUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Map Preview Box */}
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <span>Xem trước ảnh nền bản đồ hiện tại:</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-md text-gray-600 font-mono">
                        {cfg.mapImageBg?.startsWith('data:') 
                          ? 'Ảnh Tải Lên (Data URL Tối Ưu)' 
                          : cfg.mapImageBg?.startsWith('/') 
                          ? 'Sơ Đồ Vector Local (/cliff-map.svg)' 
                          : 'Đường Dẫn URL Trực Tiếp / CDN'}
                      </span>
                      {cfg.mapImageBg && cfg.mapImageBg !== '/cliff-map.svg' && (
                        <button
                          type="button"
                          onClick={() => {
                            const newCfg = { ...cfg, mapImageBg: '/cliff-map.svg' };
                            setCfg(newCfg);
                            onSaveAll(locList, newCfg);
                          }}
                          className="text-[10px] text-red-600 hover:underline font-bold"
                        >
                          Xóa & Đặt Lại Gốc
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="w-full h-52 bg-slate-900 rounded-xl overflow-hidden border border-gray-200 relative flex items-center justify-center p-2">
                    {cfg.mapImageBg ? (
                      <img
                        src={cfg.mapImageBg}
                        alt="Resort Map Preview"
                        className="w-full h-full object-contain rounded-lg"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/cliff-map.svg';
                        }}
                      />
                    ) : (
                      <div className="text-gray-400 text-xs flex flex-col items-center gap-1">
                        <ImageIcon className="w-6 h-6 stroke-1" />
                        <span>Chưa thiết lập ảnh nền bản đồ</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Tên Resort / Khách Sạn</label>
                <input
                  type="text"
                  value={cfg.resortName}
                  onChange={(e) => setCfg({ ...cfg, resortName: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Slogan / Tagline</label>
                <input
                  type="text"
                  value={cfg.tagline}
                  onChange={(e) => setCfg({ ...cfg, tagline: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Số Điện Thoại Hotline Lễ Tân</label>
                <input
                  type="text"
                  value={cfg.hotline}
                  onChange={(e) => setCfg({ ...cfg, hotline: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Trang Web Chính Thức</label>
                <input
                  type="text"
                  value={cfg.website}
                  onChange={(e) => setCfg({ ...cfg, website: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-bold mb-1">Địa Chỉ Resort</label>
                <input
                  type="text"
                  value={cfg.address}
                  onChange={(e) => setCfg({ ...cfg, address: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none"
                />
              </div>

              {/* 1. CUSTOM VOICE NARRATION SETTINGS SECTION */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <label className="block text-[#1A365D] font-bold text-xs flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-[#C5A059]" />
                    <span>Cấu Hình Giọng Đọc Thuyết Minh Mặc Định (Audio AI)</span>
                  </label>
                  <span className="text-[10px] bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200">
                    ✨ Gemini Speech Synthesis
                  </span>
                </div>

                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Lựa chọn giọng đọc mặc định khi du khách bấm vào nút <b>"Thuyết Minh AI"</b> ở các khu vực tiện ích.
                </p>

                {/* Voice Style Selection */}
                <div className="space-y-1.5">
                  <span className="block font-bold text-gray-700 text-[11px]">Giọng Đọc Mặc Định:</span>
                  <div className="relative">
                    <select
                      value={cfg.defaultVoiceStyle || ''}
                      onChange={(e) => setCfg({ ...cfg, defaultVoiceStyle: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-gray-200 bg-white text-[#2D3748] text-sm focus:border-[#C5A059] outline-none appearance-none pr-8"
                    >
                      <option value="" disabled>-- Chọn giọng đọc từ hệ thống --</option>
                      {ttsVoices.map(voice => (
                        <option key={voice.id} value={voice.id}>
                          {voice.name}
                        </option>
                      ))}
                      {ttsVoices.length === 0 && (
                        <option value="" disabled>Đang tải danh sách giọng đọc...</option>
                      )}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
                </div>

                {/* Speech Rate Selection */}
                <div className="space-y-1.5 pt-1">
                  <span className="block font-bold text-gray-700 text-[11px]">Tốc Độ Đọc Mặc Định:</span>
                  <div className="flex items-center gap-2">
                    {[
                      { rate: 0.85, label: '0.85x (Chậm & Thư Giãn)' },
                      { rate: 1.0, label: '1.0x (Chuẩn Mặc Định)' },
                      { rate: 1.15, label: '1.15x (Nhanh Cung Cấp Tóm Tắt)' }
                    ].map(({ rate, label }) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setCfg({ ...cfg, defaultSpeechRate: rate })}
                        className={`flex-1 py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all text-center ${
                          (cfg.defaultSpeechRate ?? 1.0) === rate
                            ? 'bg-[#1A365D] text-white border-[#1A365D] shadow-xs'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 2. CUSTOM AMBIENT BACKGROUND MUSIC SETTINGS SECTION */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <label className="block text-[#1A365D] font-bold text-xs flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-[#C5A059]" />
                    <span>Cấu Hình Âm Thanh & Nhạc Nền Resort (Ambient Sound)</span>
                  </label>
                  
                  {/* Enable/Disable Toggle */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.ambientSoundEnabled}
                      onChange={(e) => setCfg({ ...cfg, ambientSoundEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C5A059]"></div>
                    <span className="ml-2 text-[11px] font-bold text-gray-700">
                      {cfg.ambientSoundEnabled ? 'Đang Bật' : 'Đã Tắt'}
                    </span>
                  </label>
                </div>

                <p className="text-gray-500 text-[11px] leading-relaxed">
                  Thiết lập bản nhạc phát tự động khi du khách tải bản đồ. Mặc định hệ thống sẽ dùng <b>tiếng sóng biển 3D</b> synthesized. Bạn có thể dán link file nhạc audio (.mp3, .wav) để thay thế bằng nhạc nền thương hiệu riêng.
                </p>

                {/* Ambient Music URL Input */}
                <div className="space-y-1.5">
                  <label className="block font-bold text-gray-700 text-[11px]">
                    Link File Âm Nhạc Nền Tùy Chỉnh (MP3 / Audio Track URL):
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={cfg.ambientMusicUrl || ''}
                      onChange={(e) => setCfg({ ...cfg, ambientMusicUrl: e.target.value })}
                      placeholder="Dán URL nhạc nền (Ví dụ: https://domain.com/ocean-lounge.mp3)"
                      className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-[#2D3748] focus:bg-white focus:border-[#1A365D] outline-none text-xs"
                    />
                    {cfg.ambientMusicUrl && (
                      <button
                        type="button"
                        onClick={() => setCfg({ ...cfg, ambientMusicUrl: '' })}
                        className="px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold transition-colors text-xs"
                        title="Xóa link nhạc tùy chỉnh (Trở về tiếng sóng)"
                      >
                        Xóa Link
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="space-y-1.5 pt-1">
                  <span className="block font-bold text-gray-500 text-[10px] uppercase tracking-wider">
                    Gợi ý mẫu bản nhạc nền:
                  </span>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setCfg({ ...cfg, ambientMusicUrl: '' })}
                      className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                        !cfg.ambientMusicUrl || cfg.ambientMusicUrl.trim() === ''
                          ? 'bg-[#1A365D] text-white border-[#1A365D] shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>🌊 Mặc Định (Tiếng Sóng Biển 3D)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCfg({ ...cfg, ambientMusicUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3' })}
                      className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                        cfg.ambientMusicUrl === 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3'
                          ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Music className="w-3.5 h-3.5 text-amber-600" />
                      <span>🎹 Piano Resort Thu Cút (Chill Piano)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCfg({ ...cfg, ambientMusicUrl: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3' })}
                      className={`px-3 py-1.5 rounded-xl border font-bold transition-all flex items-center gap-1.5 ${
                        cfg.ambientMusicUrl === 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3'
                          ? 'bg-[#C5A059] text-white border-[#C5A059] shadow-xs'
                          : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <Headphones className="w-3.5 h-3.5 text-blue-600" />
                      <span>🌴 Tropical Acoustic Lounge</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 3. MUI NE WEATHER API & MAP OVERLAY SETTINGS SECTION */}
              <div className="p-4 bg-white rounded-2xl border border-gray-200 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <label className="block text-[#1A365D] font-bold text-xs flex items-center gap-1.5">
                    <CloudSun className="w-4 h-4 text-[#C5A059]" />
                    <span>Cấu Hình Trạm Thời Tiết Mũi Né & Lớp Phủ Bản Đồ 3D (Open-Meteo)</span>
                  </label>

                  {/* Toggle Auto Sync Weather */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cfg.autoSyncWeather !== false}
                      onChange={(e) => setCfg({ ...cfg, autoSyncWeather: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#C5A059]"></div>
                    <span className="ml-2 text-[11px] font-bold text-gray-700">
                      {cfg.autoSyncWeather !== false ? 'Đồng Bộ API Bật' : 'Đã Tắt API'}
                    </span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[11px]">Tọa Độ Vĩ Độ (Latitude)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={cfg.weatherStationLat ?? 10.9329}
                      onChange={(e) => setCfg({ ...cfg, weatherStationLat: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 font-bold mb-1 text-[11px]">Tọa Độ Kinh Độ (Longitude)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={cfg.weatherStationLng ?? 108.1017}
                      onChange={(e) => setCfg({ ...cfg, weatherStationLng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-[#2D3748] focus:border-[#1A365D] outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Select Weather Overlay Preset */}
                <div className="space-y-2 pt-1">
                  <span className="block font-bold text-gray-700 text-[11px]">
                    Tùy Chọn Lớp Phủ Thời Tiết Bản Đồ (Map Visual Overlay):
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      {
                        id: 'auto',
                        label: '🔄 Tự Động Theo API & Giờ UTC+7',
                        desc: 'Tự động hiển thị nắng/chiều/đêm & mưa theo thời tiết Mũi Né thực tế'
                      },
                      {
                        id: 'clear',
                        label: '☀️ Nắng Đẹp / Vệt Sáng Biển',
                        desc: 'Ánh nắng miền biển rực rỡ kèm vệt sáng lens flare'
                      },
                      {
                        id: 'cloudy',
                        label: '⛅ Mây Trôi Rải Rác',
                        desc: 'Hiệu ứng bóng mây trôi nhẹ bồng bềnh trên resort'
                      },
                      {
                        id: 'fog',
                        label: '🌫️ Sương Mù Ven Biển',
                        desc: 'Lớp hơi sương mờ ảo đung đưa dọc bờ biển Phú Hài'
                      },
                      {
                        id: 'rain',
                        label: '🌧️ Mưa Rào Mũi Né',
                        desc: 'Hiệu ứng hạt mưa rơi chéo sinh động trên bản đồ'
                      },
                      {
                        id: 'thunderstorm',
                        label: '🌩️ Dông Bão Nhiệt Đới',
                        desc: 'Mưa lớn kèm chớp sáng nhấp nháy ấn tượng'
                      }
                    ].map((p) => {
                      const isSelected = (cfg.activeWeatherOverlay || 'auto') === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setCfg({ ...cfg, activeWeatherOverlay: p.id as any })}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? 'border-[#C5A059] bg-amber-50/70 text-[#1A365D] font-bold shadow-xs'
                              : 'border-gray-200 bg-gray-50/50 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs mb-0.5">
                            <span className="font-bold">{p.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#C5A059]" />}
                          </div>
                          <span className="text-[10px] text-gray-500 font-normal leading-tight">
                            {p.desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: TOUR MANAGEMENT */}
          {activeTab === 'tour' && (
            <AdminTourTab 
              tourConfig={cfg.tourConfig} 
              locations={locList} 
              onUpdate={(newConfig) => setCfg({ ...cfg, tourConfig: newConfig })} 
            />
          )}

          {/* TAB: WORDPRESS INTEGRATION */}
          {activeTab === 'wordpress' && (
            <div className="max-w-4xl mx-auto">
              <WordPressEmbedContent />
            </div>
          )}

          {/* TAB 4: BACKUP & RESTORE */}
          {activeTab === 'backup' && (
            <div className="max-w-2xl mx-auto space-y-6 text-xs">
              <div className="p-6 bg-[#FDFCFB] rounded-2xl border border-gray-200 space-y-3 shadow-xs">
                <h3 className="font-serif font-bold text-sm text-[#1A365D]">Xuất Dữ Liệu Cấu Hình (Export JSON)</h3>
                <p className="text-gray-600">Tải về file JSON sao lưu toàn bộ thông tin bản đồ, các ghim vị trí và danh sách slide ảnh.</p>
                <button
                  onClick={handleExportJSON}
                  className="px-5 py-2.5 rounded-xl bg-[#1A365D] hover:bg-[#2A4365] text-white font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Download className="w-4 h-4 text-[#C5A059]" /> Tải File Backup JSON
                </button>
              </div>

              <div className="p-6 bg-[#FDFCFB] rounded-2xl border border-gray-200 space-y-3 shadow-xs">
                <h3 className="font-serif font-bold text-sm text-[#1A365D]">Phục Hồi Dữ Liệu Từ JSON (Import JSON)</h3>
                <p className="text-gray-600">Tải lên file JSON cấu hình đã lưu trước đó để cập nhật lại toàn bộ bản đồ.</p>
                <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#B38E47] text-white font-bold cursor-pointer shadow-sm transition-all">
                  <Upload className="w-4 h-4" /> Chọn File JSON
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportJSON}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="p-6 bg-red-50/50 rounded-2xl border border-red-200 space-y-3">
                <h3 className="font-serif font-bold text-sm text-red-700">Khôi Phục Dữ Liệu Mặc Định Gốc</h3>
                <p className="text-red-600/80">Đặt lại toàn bộ 18 điểm ghim ban đầu của The Cliff Resort & Residences.</p>
                <button
                  onClick={() => {
                    if (confirm("Khôi phục bản đồ về dữ liệu mặc định ban đầu?")) {
                      onResetToDefault();
                      setLocList(locations);
                    }
                  }}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <RotateCcw className="w-4 h-4" /> Reset Mặc Định Gốc
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: GOOGLE DRIVE IMPORT CONFIGURATION */}
      {showDriveModal && driveScanResult && (() => {
        const selectedImgCount = driveScanResult.images.filter((i) => selectedDriveIds.includes(i.id)).length;
        const selectedVidCount = driveScanResult.videos.filter((v) => selectedDriveIds.includes(v.id)).length;
        const totalSelected = selectedImgCount + selectedVidCount;

        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-[#2D3748]">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FDFCFB]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#1A365D]/10 flex items-center justify-center text-[#1A365D]">
                    <FolderOpen className="w-5 h-5 text-[#C5A059]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base text-[#1A365D]">
                      Nhập Ảnh & Video từ Google Drive
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                      <span>Thư mục:</span>
                      <strong className="text-[#2D3748]">{driveScanResult.folderName}</strong>
                    </p>
                  </div>
                </div>

                <button
                  disabled={isImportingDrive}
                  onClick={() => {
                    setShowDriveModal(false);
                    setDriveScanResult(null);
                  }}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
                {/* Summary Stats Badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">Tổng Quét Được</span>
                      <span className="text-sm font-bold text-blue-900">{driveScanResult.totalFiles} tệp</span>
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      <FileImage className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-600 block">Ảnh Tìm Thấy</span>
                      <span className="text-sm font-bold text-emerald-900">{driveScanResult.totalImages} ảnh</span>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 font-bold">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 block">Video Tìm Thấy</span>
                      <span className="text-sm font-bold text-amber-900">{driveScanResult.totalVideos} video</span>
                    </div>
                  </div>
                </div>

                {/* Quick Quantity Selectors & Presets */}
                <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-[#1A365D] text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <span>Cấu hình nhanh số lượng:</span>
                      <span className="text-gray-400 font-normal normal-case">(cho #{currentLoc?.code} - {currentLoc?.title})</span>
                    </h4>
                    <span className="text-[11px] text-gray-500">
                      Đang chọn: <strong className="text-emerald-700">{selectedImgCount} ảnh</strong> & <strong className="text-amber-700">{selectedVidCount} video</strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Image Quantity Box */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <FileImage className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-[#2D3748] block text-[11px]">Ảnh:</span>
                          <span className="text-[10px] text-gray-400">Đã chọn {selectedImgCount}/{driveScanResult.totalImages}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={driveScanResult.totalImages}
                          value={selectedImgCount}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(driveScanResult.totalImages, parseInt(e.target.value) || 0));
                            selectFirstNDriveImages(val);
                          }}
                          disabled={isImportingDrive || driveScanResult.totalImages === 0}
                          className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#1A365D] text-center focus:outline-none focus:border-[#1A365D]"
                        />
                        <button
                          type="button"
                          onClick={selectAllDriveImages}
                          disabled={isImportingDrive || driveScanResult.totalImages === 0}
                          className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllDriveImages}
                          disabled={isImportingDrive}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          0
                        </button>
                      </div>
                    </div>

                    {/* Video Quantity Box */}
                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Film className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <div>
                          <span className="font-bold text-[#2D3748] block text-[11px]">Video:</span>
                          <span className="text-[10px] text-gray-400">Đã chọn {selectedVidCount}/{driveScanResult.totalVideos}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={0}
                          max={driveScanResult.totalVideos}
                          value={selectedVidCount}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(driveScanResult.totalVideos, parseInt(e.target.value) || 0));
                            selectFirstNDriveVideos(val);
                          }}
                          disabled={isImportingDrive || driveScanResult.totalVideos === 0}
                          className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-[#1A365D] text-center focus:outline-none focus:border-[#1A365D]"
                        />
                        <button
                          type="button"
                          onClick={selectAllDriveVideos}
                          disabled={isImportingDrive || driveScanResult.totalVideos === 0}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Tất cả
                        </button>
                        <button
                          type="button"
                          onClick={deselectAllDriveVideos}
                          disabled={isImportingDrive}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                        >
                          0
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Preview Gallery */}
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-gray-700 font-bold text-[11px] flex items-center gap-1.5">
                      <span>Nhấp trực tiếp vào ảnh/video để Chọn hoặc Bỏ Chọn ({totalSelected}/{driveScanResult.totalFiles}):</span>
                    </span>

                    {/* Bulk Selection Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={selectAllDriveItems}
                        disabled={isImportingDrive}
                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        ✓ Chọn tất cả ({driveScanResult.totalFiles})
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllDriveItems}
                        disabled={isImportingDrive}
                        className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        ✕ Bỏ chọn tất cả
                      </button>
                      <button
                        type="button"
                        onClick={invertDriveSelection}
                        disabled={isImportingDrive}
                        className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] font-medium transition-colors cursor-pointer"
                      >
                        🔄 Đảo lựa chọn
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5 max-h-72 overflow-y-auto p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    {/* Images */}
                    {driveScanResult.images.map((img, idx) => {
                      const isSelected = selectedDriveIds.includes(img.id);
                      return (
                        <div
                          key={img.id || idx}
                          onClick={() => toggleDriveItemSelection(img.id)}
                          title={`Bấm để ${isSelected ? 'bỏ chọn' : 'chọn'} ${img.name}`}
                          className={`group relative rounded-xl overflow-hidden border-2 aspect-square bg-gray-100 cursor-pointer select-none transition-all duration-150 transform active:scale-95 ${
                            isSelected
                              ? 'border-emerald-500 ring-2 ring-emerald-400/40 shadow-sm opacity-100'
                              : 'border-gray-200 opacity-40 hover:opacity-85 hover:border-gray-400 grayscale'
                          }`}
                        >
                          <img
                            src={img.thumbnailUrl}
                            alt={img.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          
                          {/* Top-Right Checkbox Badge */}
                          <div className="absolute top-1.5 right-1.5">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-black/40 border border-white/70 text-transparent flex items-center justify-center group-hover:border-white">
                                <Check className="w-3 h-3 group-hover:text-white/40" />
                              </div>
                            )}
                          </div>

                          {/* Index badge */}
                          <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                            #{idx + 1}
                          </span>

                          {/* Filename Bar */}
                          <span className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-[2px] text-white text-[9px] px-1.5 py-0.5 truncate text-center">
                            {img.name}
                          </span>
                        </div>
                      );
                    })}

                    {/* Videos */}
                    {driveScanResult.videos.map((vid, idx) => {
                      const isSelected = selectedDriveIds.includes(vid.id);
                      return (
                        <div
                          key={vid.id || idx}
                          onClick={() => toggleDriveItemSelection(vid.id)}
                          title={`Bấm để ${isSelected ? 'bỏ chọn' : 'chọn'} ${vid.name}`}
                          className={`group relative rounded-xl overflow-hidden border-2 aspect-square bg-gray-900 cursor-pointer select-none transition-all duration-150 transform active:scale-95 ${
                            isSelected
                              ? 'border-amber-500 ring-2 ring-amber-400/40 shadow-sm opacity-100'
                              : 'border-gray-200 opacity-40 hover:opacity-85 hover:border-gray-400 grayscale'
                          }`}
                        >
                          <img
                            src={vid.thumbnailUrl}
                            alt={vid.name}
                            className="w-full h-full object-cover opacity-80"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <Film className="w-6 h-6 text-white/90 drop-shadow-md" />
                          </div>

                          {/* Top-Right Checkbox Badge */}
                          <div className="absolute top-1.5 right-1.5">
                            {isSelected ? (
                              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-black/40 border border-white/70 text-transparent flex items-center justify-center group-hover:border-white">
                                <Check className="w-3 h-3 group-hover:text-white/40" />
                              </div>
                            )}
                          </div>

                          {/* Index badge */}
                          <span className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                            V#{idx + 1}
                          </span>

                          {/* Filename Bar */}
                          <span className="absolute bottom-0 inset-x-0 bg-black/75 backdrop-blur-[2px] text-white text-[9px] px-1.5 py-0.5 truncate text-center">
                            {vid.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Progress message if importing */}
                {isImportingDrive && (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-900 animate-pulse">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                    <span className="font-medium text-xs">{driveImportProgress || 'Đang xử lý tải dữ liệu...'}</span>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-100 bg-[#FDFCFB] flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  Đã chọn: <strong className="text-[#1A365D] font-bold text-sm">{totalSelected}</strong> / {driveScanResult.totalFiles} tệp
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isImportingDrive}
                    onClick={() => {
                      setShowDriveModal(false);
                      setDriveScanResult(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>

                  <button
                    type="button"
                    disabled={isImportingDrive || totalSelected === 0}
                    onClick={handleConfirmDriveImport}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 shadow-md transition-all ${
                      isImportingDrive || totalSelected === 0
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#1A365D] hover:bg-[#122642] cursor-pointer'
                    }`}
                  >
                    {isImportingDrive ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Đang lưu về kho ảnh...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-[#C5A059]" />
                        <span>Nhập {totalSelected} Tệp Đã Chọn Vào Slide</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

