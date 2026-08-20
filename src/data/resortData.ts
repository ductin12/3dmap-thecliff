import { LocationItem, ResortConfig } from '../types';

export const DEFAULT_RESORT_CONFIG: ResortConfig = {
  resortName: "The Cliff Resort & Residences",
  tagline: "Biển Xanh - Nắng Vàng - Trải Nghiệm Đẳng Cấp 5 Sao",
  hotline: "1900 0394",
  website: "https://thecliffresort.com.vn",
  address: "Zone 5, Phú Thủy, TP. Phan Thiết, Lâm Đồng",
  mapImageBg: "/cliff-map.svg",
  weatherTemperature: "29°C - Nắng Nhẹ",
  ambientSoundEnabled: true,
  ambientMusicUrl: "",
  defaultVoiceStyle: "female_ai",
  defaultSpeechRate: 1.0,
  autoSyncWeather: true,
  activeWeatherOverlay: "auto",
  weatherStationLat: 10.9329,
  weatherStationLng: 108.1017,
  tourConfig: {
    title: "The Cliff Discovery Tour",
    estimatedDuration: "15 Phút",
    steps: [
      { locationId: "loc-1", narrationScript: "Chào mừng quý khách đến với khu vực lưu trú Azul Sea View..." },
      { locationId: "loc-10", narrationScript: "Trước mặt quý khách là hồ bơi vô cực lớn nhất..." }
    ]
  }
};

export const INITIAL_LOCATIONS: LocationItem[] = [
  {
    id: "loc-1",
    code: "1",
    title: "AZUL POOL / SEA VIEW",
    subtitle: "Phòng Hướng Biển & Hồ Bơi Azul",
    category: "accommodation",
    x: 58.2,
    y: 44.8,
    description: "Khu phòng Azul Pool & Sea View tọa lạc ngay trung tâm resort, với tầm nhìn bao quát toàn bộ hồ bơi tràn bờ và đại dương xanh thẳm. Các phòng được thiết kế theo phong cách Địa Trung Hải hiện đại với tông màu xanh ngọc tươi mát.",
    highlights: ["Tầm nhìn trực diện biển & hồ bơi", "Ban công riêng thoáng đãng", "Nội thất gỗ & mây tre cao cấp", "Cách sảnh chính chỉ 10m"],
    openingHours: "24/7",
    contactExt: "Phím 0 (Lễ Tân)",
    capacity: "2 - 3 Khách / Phòng",
    viewType: "Toàn cảnh Hồ bơi & Biển",
    distanceFromLobby: "10m - 30 giây đi bộ",
    amenities: ["Wifi miễn phí", "Điều hòa", "Bồn tắm nằm", "Smart TV 55 inch", "Minibar", "Ban công biển"],
    bookingLink: "https://thecliffresort.com.vn/accommodation/azul-sea-view/",
    images: [
      { id: "img-1-1", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop", title: "Phòng Azul Sea View", caption: "Không gian sang trọng tràn ngập ánh nắng biển" },
      { id: "img-1-2", url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1200&auto=format&fit=crop", title: "Ban công riêng", caption: "Tầm nhìn tuyệt đẹp hướng ra hồ bơi chính" },
      { id: "img-1-3", url: "https://images.unsplash.com/photo-1618773928121-c32242e63f39?q=80&w=1200&auto=format&fit=crop", title: "Nội thất cao cấp", caption: "Thiết kế Địa Trung Hải ấm cúng & thư thái" }
    ]
  },
  {
    id: "loc-2",
    code: "2",
    title: "AZUL POOL / SEA VIEW DUPLEX OCEAN",
    subtitle: "Căn Hộ Duplex Hướng Biển 2 Tầng",
    category: "accommodation",
    x: 38.8,
    y: 46.2,
    description: "Loại phòng Duplex 2 tầng thiết kế thông thông thoáng, sở hữu không gian phòng khách rộng rãi ở tầng dưới và phòng ngủ lãng mạn tầng trên. Phù hợp cho gia đình nhỏ hoặc cặp đôi muốn không gian riêng tư đẳng cấp.",
    highlights: ["Thiết kế 2 tầng Duplex thông tầng", "Phòng khách riêng biệt", "Bồn tắm Jacuzzi ngắm biển", "View hướng biển & sân Pickleball"],
    openingHours: "24/7",
    capacity: "2 - 4 Khách",
    viewType: "Biển & Hồ bơi",
    distanceFromLobby: "40m - 1 phút đi bộ",
    amenities: ["Wifi tốc độ cao", "Sofa giường", "Jacuzzi", "Máy pha cà phê Espresso", "Tủ lạnh lớn"],
    images: [
      { id: "img-2-1", url: "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1200&auto=format&fit=crop", title: "Phòng khách Duplex", caption: "Tầng trệt thoáng đãng kết nối thiên nhiên" },
      { id: "img-2-2", url: "https://images.unsplash.com/photo-1591088398332-8a7791972843?q=80&w=1200&auto=format&fit=crop", title: "Phòng ngủ tầng lửng", caption: "Góc nhìn ngút ngàn hướng ra biển khơi" }
    ]
  },
  {
    id: "loc-3",
    code: "3",
    title: "AZUL GARDEN VIEW",
    subtitle: "Khu Căn Hộ Azul Hướng Vườn Nhiệt Đới",
    category: "accommodation",
    x: 91.2,
    y: 68.1,
    description: "Nằm nép mình trong khuôn viên vườn cây xanh mát gần lối vào resort, Azul Garden View mang lại không gian yên tĩnh tuyệt đối, rợp bóng dừa và hoa cúc biển.",
    highlights: ["Môi trường xanh thư thái", "Gần khu thể thao & lối vào", "Giá phòng tối ưu cho gia đình"],
    openingHours: "24/7",
    capacity: "2 Khách",
    viewType: "Vườn nhiệt đới",
    distanceFromLobby: "60m - 1.5 phút đi bộ",
    amenities: ["Wifi", "Máy lạnh", "Ban công vườn", "Két an toàn", "Dịch vụ phòng"],
    images: [
      { id: "img-3-1", url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=1200&auto=format&fit=crop", title: "Khu vườn Azul", caption: "Bao quanh bởi thảm thực vật nhiệt đới" }
    ]
  },
  {
    id: "loc-4a",
    code: "4A",
    title: "BUNGALOW GARDEN / BEACH FRONT",
    subtitle: "Bungalow Vườn & Bungalow Sát Biển Mái Tranh",
    category: "accommodation",
    x: 62.1,
    y: 27.9,
    description: "Những ngôi nhà Bungalow đậm chất nghỉ dưỡng miền biển với mái tranh mộc mạc nhưng bên trong là tiện nghi 5 sao hiện đại. Mở cửa ra là bãi cỏ xanh ngát hoặc bước vài bước chân tới bờ cát trắng mịn.",
    highlights: ["Không gian riêng biệt hoàn toàn", "Mái tranh mộc mạc sang trọng", "Phòng tắm ngoài trời độc đáo", "Tiếng sóng biển rì rào đêm ngày"],
    openingHours: "24/7",
    capacity: "2 - 3 Khách",
    viewType: "Biển trực diện hoặc Vườn Dừa",
    distanceFromLobby: "80m - 2 phút đi bộ",
    amenities: ["Sân hiên riêng", "Phòng tắm vòi sen ngoài trời", "Ghế tắm nắng", "Cà phê & trà miễn phí"],
    images: [
      { id: "img-4a-1", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop", title: "Bungalow Beach Front", caption: "Bungalow ngay trên bãi cát biển Mũi Né" },
      { id: "img-4a-2", url: "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?q=80&w=1200&auto=format&fit=crop", title: "Sân hiên Bungalow", caption: "Nơi thư giãn thưởng trà ngắm bình minh" }
    ]
  },
  {
    id: "loc-4b",
    code: "4B",
    title: "VILLA OCEAN FRONT",
    subtitle: "Biệt Thự VIP 3-4 Phòng Ngủ Có Hồ Bơi Riêng",
    category: "accommodation",
    x: 31.4,
    y: 21.8,
    description: "Dòng sản phẩm đẳng cấp nhất tại The Cliff Resort. Các căn Villa Ocean Front tọa lạc ở vị trí sát vách đá tự nhiên hướng thẳng ra biển Đông, trang bị hồ bơi vô cực riêng biệt, phòng ăn rộng lớn và dịch vụ quản gia cao cấp.",
    highlights: ["Hồ bơi vô cực riêng tại Villa", "Sát vách đá ngắm hoàng hôn đỉnh cao", "3 đến 4 phòng ngủ khép kín", "Dịch vụ BBQ riêng tại sân vườn Villa"],
    openingHours: "24/7",
    capacity: "6 - 10 Khách",
    viewType: "Toàn cảnh Đại Dương 180 độ",
    distanceFromLobby: "120m - 2.5 phút đi xe điện",
    amenities: ["Hồ bơi riêng", "Bếp gia đình đầy đủ", "Quản gia riêng", "Loa Marshall Premium", "Xe điện phục vụ 24/7"],
    images: [
      { id: "img-4b-1", url: "https://images.unsplash.com/photo-1613977257363-707ba9348227?q=80&w=1200&auto=format&fit=crop", title: "Villa Ocean Front", caption: "Hồ bơi vô cực riêng hướng thẳng ra biển" },
      { id: "img-4b-2", url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?q=80&w=1200&auto=format&fit=crop", title: "Phòng khách Villa", caption: "Không gian mở kết nối hồ bơi & biển" }
    ]
  },
  {
    id: "loc-5-6",
    code: "5, 6",
    title: "TERRA / VERDE CONDOS",
    subtitle: "Căn Hộ Nghỉ Dưỡng Cao Cấp Sườn Đồi",
    category: "accommodation",
    x: 86.5,
    y: 38.5,
    description: "Dãy căn hộ Terra & Verde được xếp tầng uốn lượn theo sườn đồi tự nhiên. Điểm đặc trưng là ban công siêu rộng tích hợp bồn bơi Jacuzzi sủi bọt ngắm nhìn biển từ trên cao.",
    highlights: ["Ban công rộng lớn có Jacuzzi ngoạn mục", "Kiến trúc giật tầng Địa Trung Hải", "Phù hợp nghỉ dưỡng dài ngày"],
    openingHours: "24/7",
    capacity: "2 - 6 Khách",
    viewType: "Toàn cảnh vịnh Mũi Né",
    distanceFromLobby: "50m - 1 phút đi bộ",
    amenities: ["Jacuzzi ngoài trời ban công", "Bếp nhỏ", "Sofa băng rộng", "Máy giặt sấy"],
    images: [
      { id: "img-5-1", url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop", title: "Terra Condo", caption: "Ban công rợp bóng hoa giấy & Jacuzzi ngắm biển" }
    ]
  },
  {
    id: "loc-7",
    code: "7",
    title: "VELA",
    subtitle: "Khu Biệt Thự Vela Đồi Dừa",
    category: "accommodation",
    x: 27.5,
    y: 36.8,
    description: "Nằm giữa đồi dừa ngợp bóng mát, Villa Vela đem lại không gian thoáng đạt với lối đi lát đá tự nhiên kết nối thẳng xuống hồ bơi lớn và bãi biển.",
    highlights: ["Yên tĩnh & rợp bóng mát", "Kiến trúc xanh hiện đại", "Lối đi bộ dạo mát đẹp nhất resort"],
    openingHours: "24/7",
    capacity: "2 - 4 Khách",
    viewType: "Vườn dừa & Biển",
    distanceFromLobby: "100m",
    amenities: ["Wifi", "Phòng khách", "Sân vườn nhỏ", "Dịch vụ trà chiều"],
    images: [
      { id: "img-7-1", url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?q=80&w=1200&auto=format&fit=crop", title: "Biệt thự Vela", caption: "Góc yên bình giữa mảng xanh nhiệt đới" }
    ]
  },
  {
    id: "loc-8",
    code: "8",
    title: "VISTA RESTAURANT",
    subtitle: "Nhà Hàng Ẩm Thực Biển Vista",
    category: "dining",
    x: 58.8,
    y: 49.2,
    description: "Nhà hàng Vista là trái tim ẩm thực của The Cliff Resort. Nổi tiếng với đại tiệc Buffet hải sản tươi sống Mũi Né, các món ăn Việt Nam thuần túy và ẩm thực Âu - Á tinh tế với không gian mở lộng gió biển.",
    highlights: ["Buffet sáng đa dạng phong phú", "Hải sản tươi sống đánh bắt trong ngày", "Tiệc lẩu thả Mũi Né đặc sản", "Không gian ngắm hoàng hôn lãng mạn"],
    openingHours: "06:30 - 22:00 Hàng ngày",
    contactExt: "Phím 2 (Vista Resto)",
    capacity: "300 Chỗ ngồi",
    viewType: "Biển Đông & Hồ bơi chính",
    distanceFromLobby: "Ngay trên tầng sảnh chính",
    amenities: ["Buffet sáng", "Thực đơn A la Carte", "Rượu vang cao cấp", "Ghế trẻ em", "Phục vụ tại bàn"],
    images: [
      { id: "img-8-1", url: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1200&auto=format&fit=crop", title: "Vista Restaurant", caption: "Không gian ẩm thực sang trọng ngắm trọn bờ biển" },
      { id: "img-8-2", url: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=1200&auto=format&fit=crop", title: "Món ăn đặc sản", caption: "Hải sản tươi ngon chế biến bởi các đầu bếp hàng đầu" }
    ]
  },
  {
    id: "loc-9",
    code: "9",
    title: "MEETING ROOM",
    subtitle: "Trung Tâm Hội Nghị & Sự Kiện",
    category: "facility",
    x: 68.1,
    y: 47.3,
    description: "Phòng hội nghị trang bị hệ thống âm thanh, ánh sáng, màn hình LED hiện đại. Đáp ứng hoàn hảo cho các buổi họp chiến lược, hội thảo MICE, teambuilding và tiệc cưới lãng mạn ven biển.",
    highlights: ["Màn hình LED HD cỡ lớn", "Sức chứa linh hoạt từ 50 - 250 khách", "Dịch vụ Teabreak cao cấp"],
    openingHours: "08:00 - 21:00",
    capacity: "Lên đến 250 Khách",
    distanceFromLobby: "Gần nhà hàng Vista",
    amenities: ["Màn LED", "Âm thanh ánh sáng chuẩn", "Micro không dây", "Wifi doanh nghiệp"],
    images: [
      { id: "img-9-1", url: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?q=80&w=1200&auto=format&fit=crop", title: "Phòng hội nghị", caption: "Thiết kế hiện đại chuyên nghiệp cho mọi sự kiện" }
    ]
  },
  {
    id: "loc-10",
    code: "10 (4)",
    title: "BIG POOL (MAIN POOL)",
    subtitle: "Hồ Bơi Vô Cực Trung Tâm & Pool Bar",
    category: "pool_beach",
    x: 58.1,
    y: 33.2,
    description: "Hồ bơi vô cực chính rộng hơn 1.000m² chạy dài sát mép biển. Tại đây có On-the-Rock Pool Bar phục vụ sinh tố, nước dừa tươi, cocktail trái cây và đồ ăn nhẹ ngay trên mặt nước.",
    highlights: ["Diện tích > 1000m² tràn bờ", "Pool Bar chìm dưới nước", "Ghế nằm tắm nắng cao cấp", "Các hoạt động vui chơi thể thao dưới nước"],
    openingHours: "06:00 - 19:00",
    capacity: "Tối đa 200 người",
    distanceFromLobby: "30m",
    amenities: ["Pool Bar", "Khăn tắm miễn phí", "Phao bơi check-in", "Cứu hộ trực 24/7"],
    images: [
      { id: "img-10-1", url: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=1200&auto=format&fit=crop", title: "Big Pool", caption: "Hồ bơi tràn bờ lung linh dưới nắng vàng Phan Thiết" },
      { id: "img-10-2", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop", title: "On-The-Rock Bar", caption: "Thưởng thức ly Cocktail mát lạnh ngay tại bờ hồ" }
    ]
  },
  {
    id: "loc-11",
    code: "11",
    title: "SMALL POOL",
    subtitle: "Hồ Bơi Trẻ Em & Gia Đình",
    category: "pool_beach",
    x: 43.1,
    y: 38.2,
    description: "Hồ bơi nông an toàn dành cho em bé và gia đình, tích hợp cầu trượt nước mini và các trò chơi phun nước ngộ nghĩnh.",
    highlights: ["Mực nước nông an toàn (0.6m)", "Cầu trượt nước vui nhộn", "Ghế nghỉ rợp bóng râm cho phụ huynh"],
    openingHours: "07:00 - 18:30",
    distanceFromLobby: "40m",
    amenities: ["Cầu trượt", "Áo phao trẻ em", "Nhân viên cứu hộ"],
    images: [
      { id: "img-11-1", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop", title: "Small Pool", caption: "Không gian xanh mát an toàn cho bé thỏa sức bơi lội" }
    ]
  },
  {
    id: "loc-12",
    code: "12",
    title: "ZEST SPA",
    subtitle: "Trung Tâm Trị Liệu & Thư Giãn Zest Spa",
    category: "spa_wellness",
    x: 84.8,
    y: 18.2,
    description: "Zest Spa tọa lạc trên ngọn đồi sát biển với chòi massage ngoài trời lộng gió. Liệu trình kết hợp thảo mộc thiên nhiên, đá nóng và kỹ thuật massage Thụy Điển giúp cơ thể phục hồi năng lượng tối đa.",
    highlights: ["Chòi Spa riêng biệt view biển 180 độ", "Trị liệu thảo mộc thiên nhiên", "Xông hơi đá muối & ngâm chân thảo dược", "Trà thảo mộc đón tiếp chu đáo"],
    openingHours: "09:00 - 21:00",
    contactExt: "Phím 3 (Zest Spa)",
    distanceFromLobby: "90m - Có xe điện đưa đón",
    amenities: ["Massage toàn thân", "Chăm sóc da mặt", "Xông hơi Khô/Ướt", "Spa đôi tình nhân"],
    images: [
      { id: "img-12-1", url: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?q=80&w=1200&auto=format&fit=crop", title: "Zest Spa", caption: "Không gian tĩnh lặng nhẹ nhàng ngát hương tinh dầu" },
      { id: "img-12-2", url: "https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?q=80&w=1200&auto=format&fit=crop", title: "Chòi Spa ngoài trời", caption: "Lắng nghe tiếng sóng biển trong khi thư giãn liệu trình" }
    ]
  },
  {
    id: "loc-13",
    code: "13",
    title: "BEACH CLUB",
    subtitle: "Câu Lạc Bộ Biển & Thể Thao Nước",
    category: "recreation",
    x: 70.2,
    y: 11.2,
    description: "Nơi diễn ra các hoạt động sôi động nhất bãi biển: chèo thuyền Kayak, SUP ngắm bình minh, lướt ván diều, cùng quầy Bar âm nhạc sôi động lúc hoàng hôn.",
    highlights: ["Cho thuê SUP & Kayak", "Đốt lửa trại & Acoustic ngoài trời", "Cocktail & Craft Beer ven biển"],
    openingHours: "08:00 - 23:00",
    distanceFromLobby: "100m",
    amenities: ["Dụng cụ thể thao nước", "DJ & Âm thanh ngoài trời", "Ghế lười trên cát"],
    images: [
      { id: "img-13-1", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop", title: "Beach Club", caption: "Thư giãn trên bờ biển cùng âm nhạc tuyệt diệu" }
    ]
  },
  {
    id: "loc-14",
    code: "14",
    title: "AQUA GARDEN",
    subtitle: "Khu Vườn Nước & Đường Dạo Biển Aqua",
    category: "facility",
    x: 72.1,
    y: 3.5,
    description: "Khu vườn tiểu cảnh nước lãng mạn kết hợp đường dạo bộ rợp bóng hàng dừa, là tọa độ check-in sống ảo yêu thích của du khách khi ghé thăm The Cliff.",
    highlights: ["Tiểu cảnh suối nước & hoa súng", "Con đường dừa xanh check-in thơ mộng", "Lối xuống biển lãng mạn"],
    openingHours: "Mở cửa tự do",
    distanceFromLobby: "80m",
    amenities: ["Đèn chiếu sáng ban đêm", "Ghế đá nghỉ chân"],
    images: [
      { id: "img-14-1", url: "https://images.unsplash.com/photo-1590523741831-ab7e8b8f9c7f?q=80&w=1200&auto=format&fit=crop", title: "Aqua Garden", caption: "Con đường rợp bóng dừa dẫn ra bờ biển xanh" }
    ]
  },
  {
    id: "loc-15",
    code: "15",
    title: "BEACH",
    subtitle: "Bãi Biển Riêng Cát Trắng Mũi Né",
    category: "pool_beach",
    x: 39.8,
    y: 9.8,
    description: "Bãi biển riêng tư dài gần 500m với làn nước trong xanh, bờ cát mịn màng. Được bình chọn là một trong những bãi biển nghỉ dưỡng đẹp nhất dải Phú Hài.",
    highlights: ["Sóng êm dịu thích hợp tắm biển", "Hàng ghế tắm nắng mái lá miễn phí", "Dịch vụ cứu hộ bờ biển"],
    openingHours: "05:00 - 18:30 (Giờ tắm biển an toàn)",
    distanceFromLobby: "120m",
    amenities: ["Ghế tắm nắng", "Dù che nắng", "Khăn tắm biển", "Sân bóng chuyền bãi biển"],
    images: [
      { id: "img-15-1", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop", title: "Bãi biển The Cliff", caption: "Bãi cát trắng trải dài hòa cùng đại dương biếc xanh" }
    ]
  },
  {
    id: "loc-16",
    code: "16",
    title: "GYM",
    subtitle: "Phòng Tập Gym Hướng Biển",
    category: "recreation",
    x: 72.8,
    y: 50.1,
    description: "Phòng tập thể hình hiện đại trang bị đầy đủ máy chạy bộ, xe đạp, tạ đơn và thảm Yoga với vách kính lớn nhìn thẳng ra đại dương.",
    highlights: ["Trang thiết bị Life Fitness hiện đại", "View biển truyền cảm hứng tập luyện", "Thảm Yoga & bóng tập"],
    openingHours: "06:00 - 21:00",
    distanceFromLobby: "20m (Cạnh Sảnh)",
    amenities: ["Máy chạy bộ", "Tạ đơn", "Nước uống & khăn tập miễn phí", "Điều hòa"],
    images: [
      { id: "img-16-1", url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop", title: "Phòng Gym", caption: "Nơi duy trì vóc dáng tràn đầy năng lượng" }
    ]
  },
  {
    id: "loc-17",
    code: "17",
    title: "GAME ROOM",
    subtitle: "Phòng Giải Trí Bida, Bi Lắc & Kids Club",
    category: "recreation",
    x: 55.8,
    y: 53.2,
    description: "Khu vui chơi giải trí mát mẻ trong nhà bao gồm bàn Bida chuẩn, Bi lắc, máy chơi game PS5 và góc sáng tạo dành riêng cho trẻ em.",
    highlights: ["Bàn Bida lỗ cao cấp", "Máy game PS5 & Nintendo Switch", "Góc tô tượng & bóng nhà bóng cho bé"],
    openingHours: "08:00 - 22:00",
    distanceFromLobby: "Ngay khu sảnh chính",
    amenities: ["Bida", "Bi lắc", "PS5", "Kids Club", "Điều hòa"],
    images: [
      { id: "img-17-1", url: "https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1200&auto=format&fit=crop", title: "Game Room", caption: "Phút giây giải trí thư thái cho cả gia đình" }
    ]
  },
  {
    id: "loc-18",
    code: "18",
    title: "SHOP",
    subtitle: "Cửa Hàng Lưu Niệm & Thời Trang Biển",
    category: "facility",
    x: 51.2,
    y: 51.1,
    description: "Cửa hàng tiện ích The Cliff Souvenir cung cấp quần áo đi biển, nón cối, kem chống nắng, đồ lưu niệm thủ công mỹ nghệ và các đặc sản Phan Thiết nổi tiếng (Nước mắm, Thanh Long, Mực một nắng).",
    highlights: ["Đặc sản Phan Thiết chính hiệu", "Thời trang đi biển độc đáo", "Nước uống & Snack cao cấp"],
    openingHours: "07:30 - 21:30",
    distanceFromLobby: "10m",
    amenities: ["Thanh toán thẻ/QR", "Đóng gói quà tặng"],
    images: [
      { id: "img-18-1", url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200&auto=format&fit=crop", title: "The Cliff Shop", caption: "Đa dạng món quà lưu niệm & đặc sản địa phương" }
    ]
  }
];
