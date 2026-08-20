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

// GET /api/data
app.get("/api/data", async (_req, res) => {
  try {
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
    const dataToSave = { locations, config };
    if (fs.existsSync(path.dirname(dbPath))) {
      fs.writeFileSync(dbPath, JSON.stringify(dataToSave, null, 2));
    }
    return res.json({ success: true });
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

export default app;
