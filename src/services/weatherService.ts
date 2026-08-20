export interface WeatherData {
  temperature: number; // °C
  apparentTemperature: number; // °C
  humidity: number; // %
  windSpeed: number; // km/h
  weatherCode: number; // WMO Code
  precipitation: number; // mm
  cloudCover: number; // %
  pressure?: number; // hPa
  uvIndex?: number;
  isDay: boolean;
  lightingMode: 'day' | 'sunset' | 'night';
  conditionCategory: 'clear' | 'cloudy' | 'fog' | 'rain' | 'thunderstorm';
  conditionText: string;
  locationName: string;
  lastUpdated: string;
  vietnamTimeStr: string;
}

// Mui Ne, Phan Thiet Coordinates
const MUI_NE_LAT = 10.9333;
const MUI_NE_LON = 108.2833;

/**
 * Get current time in Vietnam timezone (UTC+7 / Asia/Ho_Chi_Minh)
 */
export function getVietnamHoursAndMinutes(date: Date = new Date()): { hours: number; minutes: number; timeStr: string } {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  let hours = 0;
  let minutes = 0;
  for (const part of parts) {
    if (part.type === 'hour') {
      hours = parseInt(part.value, 10);
      if (hours === 24) hours = 0;
    }
    if (part.type === 'minute') minutes = parseInt(part.value, 10);
  }
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { hours, minutes, timeStr };
}

/**
 * Calculate lighting mode based on exact standard Vietnam time (UTC+7):
 * - 06:00 to 12:00 -> 'day' (Ban ngày)
 * - 12:01 to 18:00 -> 'sunset' (Buổi chiều)
 * - 18:01 to 05:59 -> 'night' (Ban đêm)
 */
export function getVietnamLightingMode(hours: number, minutes: number): 'day' | 'sunset' | 'night' {
  const totalMinutes = hours * 60 + minutes;
  // 06:00 = 360 mins, 12:00 = 720 mins
  // 12:01 = 721 mins, 18:00 = 1080 mins
  if (totalMinutes >= 360 && totalMinutes <= 720) {
    return 'day';
  } else if (totalMinutes > 720 && totalMinutes <= 1080) {
    return 'sunset';
  } else {
    return 'night';
  }
}

export function interpretWeatherCode(
  code: number, 
  precip: number = 0, 
  lightingMode: 'day' | 'sunset' | 'night' = 'day'
): {
  category: 'clear' | 'cloudy' | 'fog' | 'rain' | 'thunderstorm';
  text: string;
  icon: string;
} {
  if (code === 0) {
    if (lightingMode === 'night') {
      return { category: 'clear', text: 'Trời Trong Đêm Biển', icon: '🌙' };
    }
    if (lightingMode === 'sunset') {
      return { category: 'clear', text: 'Nắng Hoàng Hôn Mũi Né', icon: '🌅' };
    }
    return { category: 'clear', text: 'Nắng Đẹp Biển Xanh', icon: '☀️' };
  }
  if (code >= 1 && code <= 3) {
    if (code === 1) {
      if (lightingMode === 'night') {
        return { category: 'clear', text: 'Gió Mát Mây Thưa Đêm', icon: '🌙' };
      }
      if (lightingMode === 'sunset') {
        return { category: 'clear', text: 'Mây Thưa Chiều Tà', icon: '🌆' };
      }
      return { category: 'clear', text: 'Nắng Nhẹ Mây Thưa', icon: '🌤️' };
    }
    if (code === 2) {
      return { 
        category: 'cloudy', 
        text: lightingMode === 'night' ? 'Mây Rải Rác Đêm Biển' : 'Mây Rải Rác Mũi Né', 
        icon: lightingMode === 'night' ? '☁️' : '⛅' 
      };
    }
    return { category: 'cloudy', text: 'Trời Nhiều Mây', icon: '☁️' };
  }
  if (code === 45 || code === 48) {
    return { category: 'fog', text: 'Sương Mù Ven Biển', icon: '🌫️' };
  }
  if ((code >= 51 && code <= 57) || (code >= 61 && code <= 67) || (code >= 80 && code <= 82) || precip > 0) {
    if (code >= 80 || precip > 2.0) {
      return { 
        category: 'rain', 
        text: lightingMode === 'night' ? 'Mưa Rào Đêm Mũi Né' : 'Mưa Rào Bờ Biển', 
        icon: '🌧️' 
      };
    }
    return { 
      category: 'rain', 
      text: lightingMode === 'night' ? 'Mưa Phùn Đêm Mát' : 'Mưa Phùn Nhẹ', 
      icon: '🌦️' 
    };
  }
  if (code >= 95) {
    return { category: 'thunderstorm', text: 'Dông Bão Nhiệt Đới', icon: '🌩️' };
  }
  if (lightingMode === 'night') {
    return { category: 'clear', text: 'Gió Biển Đêm Mát Mẻ', icon: '🌙' };
  }
  return { category: 'clear', text: 'Nắng Ấm Nắng Gió', icon: '🌞' };
}

export async function fetchMuiNeWeather(lat?: number, lon?: number): Promise<WeatherData> {
  const latitude = lat ?? MUI_NE_LAT;
  const longitude = lon ?? MUI_NE_LON;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,weather_code,cloud_cover,wind_speed_10m,surface_pressure&timezone=Asia%2FHo_Chi_Minh`;

  const { hours, minutes, timeStr } = getVietnamHoursAndMinutes();
  const lightingMode = getVietnamLightingMode(hours, minutes);
  const isDaytime = lightingMode === 'day' || lightingMode === 'sunset';

  try {
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) {
      throw new Error(`Weather API error: ${res.status}`);
    }
    const data = await res.json();
    const current = data.current;

    const temp = Math.round(current.temperature_2m ?? (lightingMode === 'night' ? 26 : 29));
    const code = current.weather_code ?? 0;
    const precip = current.precipitation ?? 0;
    const humidity = current.relative_humidity_2m ?? 75;
    const wind = Math.round(current.wind_speed_10m ?? 12);
    const cloud = current.cloud_cover ?? 20;
    const pressure = current.surface_pressure ?? 1010;
    const uvIndex = isDaytime ? (cloud < 50 ? 8 : 4) : 0;

    const interpreted = interpretWeatherCode(code, precip, lightingMode);

    return {
      temperature: temp,
      apparentTemperature: Math.round(current.apparent_temperature ?? temp),
      humidity,
      windSpeed: wind,
      weatherCode: code,
      precipitation: precip,
      cloudCover: cloud,
      pressure,
      uvIndex,
      isDay: isDaytime,
      lightingMode,
      conditionCategory: interpreted.category,
      conditionText: interpreted.text,
      locationName: 'Mũi Né, Phan Thiết',
      lastUpdated: timeStr,
      vietnamTimeStr: timeStr,
    };
  } catch (err) {
    console.warn('Failed to fetch Mui Ne live weather from Open-Meteo, using UTC+7 realistic fallback:', err);
    
    let fallbackTemp = 29;
    let fallbackText = 'Nắng Nhẹ Biển Mũi Né';

    if (lightingMode === 'night') {
      fallbackTemp = 26;
      fallbackText = 'Gió Biển Đêm Mát Mẻ';
    } else if (lightingMode === 'sunset') {
      fallbackTemp = 30;
      fallbackText = 'Nắng Hoàng Hôn Mũi Né';
    }

    return {
      temperature: fallbackTemp,
      apparentTemperature: fallbackTemp + 2,
      humidity: 78,
      windSpeed: 14,
      weatherCode: 1,
      precipitation: 0,
      cloudCover: 25,
      pressure: 1012,
      uvIndex: isDaytime ? 6 : 0,
      isDay: isDaytime,
      lightingMode,
      conditionCategory: 'clear',
      conditionText: fallbackText,
      locationName: 'Mũi Né, Phan Thiết',
      lastUpdated: timeStr,
      vietnamTimeStr: timeStr,
    };
  }
}
