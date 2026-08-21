import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import crypto from "crypto";
import fs from "fs";

dotenv.config();

const app = express();
app.use(express.json({ limit: "50mb" }));

const dbPath = path.join(process.cwd(), "data", "database.json");
const dataDir = path.join(process.cwd(), "data", "audio");

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// Cloud Storage / Database Helpers for Vercel Serverless
async function getCloudData(): Promise<any | null> {
  // 1. Upstash Redis / Vercel KV via REST API
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/get/cliff_resort_database_v2`, {
        headers: { Authorization: `Bearer ${kvToken}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.result) {
          return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
        }
      }
    } catch (e) {
      console.warn("KV fetch error:", e);
    }
  }

  // 2. JSONBin.io fallback
  const jsonBinId = process.env.JSONBIN_BIN_ID;
  const jsonBinKey = process.env.JSONBIN_API_KEY;
  if (jsonBinId && jsonBinKey) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${jsonBinId}/latest`, {
        headers: { 'X-Master-Key': jsonBinKey }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.record) return json.record;
      }
    } catch (e) {
      console.warn("JSONBin fetch error:", e);
    }
  }

  return null;
}

async function saveCloudData(dataToSave: any): Promise<{ savedToCloud: boolean; driver?: string }> {
  // 1. Upstash Redis / Vercel KV via REST API
  const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (kvUrl && kvToken) {
    try {
      const res = await fetch(`${kvUrl}/set/cliff_resort_database_v2`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${kvToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSave)
      });
      if (res.ok) {
        return { savedToCloud: true, driver: 'Upstash / Vercel KV' };
      }
    } catch (e) {
      console.warn("KV save error:", e);
    }
  }

  // 2. GitHub REST API Auto-Commit
  const ghToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  const ghRepo = process.env.GITHUB_REPO || 'ductin12/3dmap-thecliff';
  if (ghToken) {
    try {
      // Get current file sha
      const getRes = await fetch(`https://api.github.com/repos/${ghRepo}/contents/data/database.json`, {
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'TheCliff3DMap-Sync'
        }
      });
      let sha = '';
      if (getRes.ok) {
        const fileInfo = await getRes.json();
        sha = fileInfo.sha;
      }

      const contentBase64 = Buffer.from(JSON.stringify(dataToSave, null, 2)).toString('base64');
      const putRes = await fetch(`https://api.github.com/repos/${ghRepo}/contents/data/database.json`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${ghToken}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'TheCliff3DMap-Sync'
        },
        body: JSON.stringify({
          message: 'chore: update resort database from Admin Panel',
          content: contentBase64,
          sha: sha || undefined
        })
      });
      if (putRes.ok) {
        return { savedToCloud: true, driver: 'GitHub Auto-Commit' };
      }
    } catch (e) {
      console.warn("GitHub commit error:", e);
    }
  }

  // 3. JSONBin.io
  const jsonBinId = process.env.JSONBIN_BIN_ID;
  const jsonBinKey = process.env.JSONBIN_API_KEY;
  if (jsonBinId && jsonBinKey) {
    try {
      const res = await fetch(`https://api.jsonbin.io/v3/b/${jsonBinId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': jsonBinKey
        },
        body: JSON.stringify(dataToSave)
      });
      if (res.ok) {
        return { savedToCloud: true, driver: 'JSONBin Cloud' };
      }
    } catch (e) {
      console.warn("JSONBin save error:", e);
    }
  }

  return { savedToCloud: false };
}

// GET /api/data
app.get("/api/data", async (_req, res) => {
  try {
    // Check cloud store first
    const cloudData = await getCloudData();
    if (cloudData && cloudData.locations) {
      return res.json(cloudData);
    }

    // Fallback to local / bundled database.json
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, "utf-8");
      return res.json(JSON.parse(data));
    }
    return res.status(404).json({ error: "No data found" });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Failed to read data" });
  }
});

// POST /api/data
app.post("/api/data", async (req, res) => {
  try {
    const { locations, config } = req.body;
    if (!locations || !config) {
      return res.status(400).json({ error: "Missing locations or config" });
    }
    const dataToSave = { locations, config, updatedAt: new Date().toISOString() };

    // 1. Try cloud database saving
    const cloudResult = await saveCloudData(dataToSave);

    // 2. Try file system write (works in Node/Docker)
    try {
      if (fs.existsSync(path.dirname(dbPath))) {
        fs.writeFileSync(dbPath, JSON.stringify(dataToSave, null, 2));
      }
    } catch (_e) {}

    return res.json({ 
      success: true, 
      cloud: cloudResult.savedToCloud, 
      driver: cloudResult.driver || 'local-file' 
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Failed to save data" });
  }
});

// POST /api/upload-map
app.post("/api/upload-map", async (req, res) => {
  try {
    const { base64Data } = req.body;
    if (!base64Data) {
      return res.status(400).json({ error: "Missing base64Data" });
    }

    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 string" });
    }

    const ext = matches[1].split('/')[1] === 'jpeg' ? 'jpg' : (matches[1].split('/')[1] || 'png');
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `map-bg-${Date.now()}.${ext}`;
    const filepath = path.join(process.cwd(), "data", filename);
    
    try {
      fs.writeFileSync(filepath, buffer);
    } catch (_e) {}
    
    return res.json({ success: true, url: `/data/${filename}` });
  } catch (e: any) {
    console.error("Upload Error:", e);
    res.status(500).json({ error: e.message || "Failed to save file" });
  }
});

// POST /api/tts
app.post("/api/tts", async (req, res) => {
  try {
    const { text, title } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text parameter is required" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return res.status(200).json({
        success: false,
        fallbackToWebSpeech: true,
        message: "GEMINI_API_KEY is not configured",
      });
    }

    const ai = new GoogleGenAI({ apiKey });
    const scriptPrompt = `Bạn là một hướng dẫn viên du lịch chuyên nghiệp tại Resort 5 sao The Cliff Resort & Residences.
Hãy viết lại bài thuyết minh dưới đây thành kịch bản đọc nói (Phonetic Speech Script) bằng Tiếng Việt cực kỳ tự nhiên, diễn cảm, ngắt nghỉ hợp lý, chuyển đổi hết số, ký tự đặc biệt, viết tắt sang từ ngữ Tiếng Việt thuần túy (VD: 24/7 -> hai mươi tư trên bảy; 50m -> năm mươi mét; 29°C -> hai mươi chín độ C) để máy đọc tự nhiên nhất.
Chỉ trả về duy nhất văn bản kịch bản đọc, không kèm lời giải thích hay định dạng Markdown thừa.

Địa điểm: ${title || "Địa điểm"}
Nội dung: ${text}`;

    let optimizedScript = text;
    try {
      const textResponse = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: scriptPrompt,
      });
      if (textResponse.text && textResponse.text.trim()) {
        optimizedScript = textResponse.text.trim();
      }
    } catch (_err) {}

    return res.json({
      success: true,
      optimizedScript,
      fallbackToWebSpeech: true,
      message: "Generated optimized Vietnamese narration script using Gemini 2.0 Flash.",
    });
  } catch (error: any) {
    return res.status(200).json({
      success: false,
      fallbackToWebSpeech: true,
      message: error?.message || "Fallback to client Web Speech API",
    });
  }
});

// POST /api/tts/generate
app.post("/api/tts/generate", async (req, res) => {
  try {
    const { id, text, voice_id } = req.body;
    if (!text || !voice_id) {
      return res.status(400).json({ error: "Missing text or voice_id" });
    }

    const hash = crypto.createHash('md5').update(text + voice_id).digest('hex');
    const filename = id ? `${id}_${voice_id}.wav` : `${hash}.wav`;
    const filepath = path.join(dataDir, filename);
    const urlPath = `/data/audio/${filename}`;

    if (fs.existsSync(filepath)) {
      return res.json({ success: true, url: urlPath, cached: true });
    }

    const ttsUrl = `https://tts.thecliff.io.vn/stream`;
    const response = await fetch(ttsUrl, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ text, voice_id })
    });

    if (!response.ok) {
      throw new Error(`TTS API returned ${response.status}`);
    }

    return res.json({ success: true, url: urlPath, cached: false });
  } catch (error: any) {
    console.error("Error generating TTS audio:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/scrape-room
app.post("/api/scrape-room", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || !url.includes("thecliffresort.com.vn")) {
      return res.status(400).json({ error: "Invalid URL. Must be a thecliffresort.com.vn URL." });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch page, status: ${response.status}`);
    }

    const html = await response.text();
    const match = html.match(/const galleryItems\s*=\s*(\[.*?\]);/s);
    if (!match || !match[1]) {
      return res.status(404).json({ error: "Could not find gallery items on the page." });
    }

    const itemsString = match[1];
    const images: string[] = [];
    let videoUrl: string | null = null;
    
    const regex = /\{[^}]*type:\s*'([^']+)'[^}]*src:\s*'([^']+)'/g;
    let m;
    while ((m = regex.exec(itemsString)) !== null) {
      const type = m[1];
      const src = m[2];
      
      if (type === 'video' && !videoUrl) {
        videoUrl = src;
      } else if (type === 'image' && images.length < 10) {
        images.push(src);
      }
    }

    const results = [];
    if (videoUrl) {
      results.push(videoUrl);
    }
    results.push(...images);

    if (results.length === 0) {
      return res.status(404).json({ error: "Found gallery items but failed to parse URLs." });
    }

    return res.json({ success: true, urls: results });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Failed to scrape URL" });
  }
});

// POST /api/gdrive/scan
app.post("/api/gdrive/scan", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "URL is required" });
    }

    const cleanUrl = url.trim();
    let folderId = "";
    const folderMatches = [
      /\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
      /\/drive\/folders\/([a-zA-Z0-9_-]+)/,
      /[?&]id=([a-zA-Z0-9_-]+)(?:&.*)?$/,
    ];

    for (const reg of folderMatches) {
      const m = cleanUrl.match(reg);
      if (m && (cleanUrl.includes("folder") || cleanUrl.includes("drive.google.com"))) {
        folderId = m[1];
        break;
      }
    }

    if (!folderId) {
      const fileMatches = [
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /\/d\/([a-zA-Z0-9_-]+)/,
        /\/uc\?(?:export=download&)?id=([a-zA-Z0-9_-]+)/,
      ];
      for (const reg of fileMatches) {
        const m = cleanUrl.match(reg);
        if (m) {
          const singleId = m[1];
          return res.json({
            success: true,
            isSingleFile: true,
            folderName: "Tệp Google Drive đơn lẻ",
            totalImages: 1,
            totalVideos: 0,
            images: [
              {
                id: singleId,
                name: `Drive_File_${singleId.substring(0, 6)}`,
                type: "image",
                thumbnailUrl: `https://lh3.googleusercontent.com/d/${singleId}=w400`,
                downloadUrl: `https://drive.google.com/uc?export=download&id=${singleId}`,
              },
            ],
            videos: [],
          });
        }
      }
      return res.status(400).json({ error: "Không tìm thấy ID thư mục hoặc tệp Google Drive hợp lệ từ đường dẫn." });
    }

    const scanUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    let scanResponse = await fetch(scanUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    let html = "";
    if (scanResponse.ok) {
      html = await scanResponse.text();
    } else {
      const fallbackRes = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      html = await fallbackRes.text();
    }

    const images: any[] = [];
    const videos: any[] = [];
    const seenIds = new Set<string>();

    const entryRegex = /id="entry-([a-zA-Z0-9_-]+)"[^>]*>.*?class="flip-entry-title"[^>]*>([^<]+)<\/div>/gs;
    let match;
    while ((match = entryRegex.exec(html)) !== null) {
      const id = match[1];
      const name = match[2].trim();
      const lower = name.toLowerCase();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        const isVideo = !!lower.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v|3gp)$/);
        const item = {
          id,
          name,
          type: isVideo ? "video" : "image",
          thumbnailUrl: isVideo 
            ? `https://drive.google.com/thumbnail?id=${id}&sz=w400`
            : `https://lh3.googleusercontent.com/d/${id}=w400`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
        };
        if (isVideo) videos.push(item);
        else images.push(item);
      }
    }

    if (images.length === 0 && videos.length === 0) {
      const ssrRegex = /\["(?<id>[a-zA-Z0-9_-]{25,45})",\s*\["(?<name>[^"]+\.(?:jpg|jpeg|png|webp|gif|mp4|mov|avi|webm|mkv))"/gi;
      let m;
      while ((m = ssrRegex.exec(html)) !== null) {
        const id = m.groups?.id;
        const name = m.groups?.name;
        if (id && name && !seenIds.has(id)) {
          seenIds.add(id);
          const lower = name.toLowerCase();
          const isVideo = !!lower.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v|3gp)$/);
          const item = {
            id,
            name,
            type: isVideo ? "video" : "image",
            thumbnailUrl: isVideo 
              ? `https://drive.google.com/thumbnail?id=${id}&sz=w400`
              : `https://lh3.googleusercontent.com/d/${id}=w400`,
            downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
          };
          if (isVideo) videos.push(item);
          else images.push(item);
        }
      }
    }

    let folderName = "Thư mục Google Drive";
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      folderName = titleMatch[1].replace(" - Google Drive", "").trim();
    }

    return res.json({
      success: true,
      folderName,
      totalFiles: images.length + videos.length,
      totalImages: images.length,
      totalVideos: videos.length,
      images,
      videos,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Lỗi khi quét thư mục Google Drive." });
  }
});

// POST /api/gdrive/import
app.post("/api/gdrive/import", async (req, res) => {
  try {
    const { items } = req.body;
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Missing items array" });
    }

    const importedSlides: any[] = [];
    for (const item of items) {
      const { id, name, type } = item;
      const finalUrl = type === "image"
        ? `https://lh3.googleusercontent.com/d/${id}=w2048`
        : `https://drive.google.com/file/d/${id}/preview`;

      importedSlides.push({
        id: `img-gdrive-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url: finalUrl,
        title: path.basename(name || "", path.extname(name || "")),
        caption: "",
        mediaType: type === "video" ? "video" : "image",
      });
    }

    return res.json({
      success: true,
      count: importedSlides.length,
      slides: importedSlides,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || "Lỗi khi nhập tệp từ Google Drive." });
  }
});

export default app;

