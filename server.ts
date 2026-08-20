import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  // API Endpoints for Data Persistence
  const dbPath = path.join(process.cwd(), "data", "database.json");

  app.get("/api/data", async (_req, res) => {
    try {
      const fs = await import("fs");
      if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, "utf-8");
        return res.json(JSON.parse(data));
      }
      return res.status(404).json({ error: "No data found" });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to read data" });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const fs = await import("fs");
      const { locations, config } = req.body;
      if (!locations || !config) {
        return res.status(400).json({ error: "Missing locations or config" });
      }
      
      const dataToSave = { locations, config };
      fs.writeFileSync(dbPath, JSON.stringify(dataToSave, null, 2));
      return res.json({ success: true });
    } catch (e: any) {
      return res.status(500).json({ error: e.message || "Failed to save data" });
    }
  });

  // API Endpoint to upload and save map background image
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

      const fs = await import("fs");
      const ext = matches[1].split('/')[1] === 'jpeg' ? 'jpg' : (matches[1].split('/')[1] || 'png');
      const buffer = Buffer.from(matches[2], 'base64');
      const filename = `map-bg-${Date.now()}.${ext}`;
      const filepath = path.join(process.cwd(), "data", filename);
      
      fs.writeFileSync(filepath, buffer);
      
      return res.json({ success: true, url: `/data/${filename}` });
    } catch (e: any) {
      console.error("Upload Error:", e);
      res.status(500).json({ error: e.message || "Failed to save file" });
    }
  });

  // API Endpoint for AI Text-To-Speech (Vietnamese Narration)
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, title, voiceName = "Kore" } = req.body;

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

      // Prompt Gemini to polish text for natural Vietnamese speech pronunciation
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
      } catch (_err) {
        // Fallback gracefully to raw text if API key quota or rate limits occur
      }

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

  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Ensure data/audio directory exists
  const fs = await import("fs");
  const crypto = await import("crypto");
  const dataDir = path.join(process.cwd(), "data", "audio");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Serve the data folder statically
  app.use("/data", express.static(path.join(process.cwd(), "data")));

  // API Endpoint for TTS Generation and Caching
  app.post("/api/tts/generate", async (req, res) => {
    try {
      const { id, text, voice_id } = req.body;
      if (!text || !voice_id) {
        return res.status(400).json({ error: "Missing text or voice_id" });
      }

      // Compute MD5 hash of text + voice_id as fallback, but use id if provided
      const hash = crypto.createHash('md5').update(text + voice_id).digest('hex');
      const filename = id ? `${id}_${voice_id}.wav` : `${hash}.wav`;
      const filepath = path.join(dataDir, filename);
      const urlPath = `/data/audio/${filename}`;

      // If file exists, return it immediately
      if (fs.existsSync(filepath)) {
        return res.json({ success: true, url: urlPath, cached: true });
      }

      // Fetch from actual TTS API using POST to avoid URL truncation
      const ttsUrl = `https://tts.thecliff.io.vn/stream`;
      const response = await fetch(ttsUrl, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ text, voice_id })
      });

      if (!response.ok) {
        throw new Error(`TTS API returned ${response.status}`);
      }
      
      if (!response.body) {
         throw new Error(`TTS API returned empty body`);
      }

      // Stream the response to a file using native fetch Web Streams
      const { Readable } = await import("stream");
      const { pipeline } = await import("stream/promises");
      const dest = fs.createWriteStream(filepath);
      // @ts-ignore
      const readableStream = Readable.fromWeb(response.body);
      
      await pipeline(readableStream, dest);

      return res.json({ success: true, url: urlPath, cached: false });
    } catch (error: any) {
      console.error("Error generating TTS audio:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // API Endpoint to scan and generate missing audio files in background
  app.post("/api/tts/scan", async (req, res) => {
    const { texts, voice_id } = req.body;
    if (!texts || !Array.isArray(texts) || !voice_id) {
      return res.status(400).json({ error: "Missing texts array or voice_id" });
    }

    // Return immediately to not block frontend
    res.json({ success: true, message: `Started background scan for ${texts.length} items.` });

    // Process sequentially in background
    (async () => {
      for (const item of texts) {
        try {
          const id = item.id;
          const text = item.text;
          const hash = crypto.createHash('md5').update(text + voice_id).digest('hex');
          const filename = id ? `${id}_${voice_id}.wav` : `${hash}.wav`;
          const filepath = path.join(dataDir, filename);

          // Force generate/overwrite for scan because scan is only called for changed items
          console.log(`[TTS Scan] Generating/Updating audio for: ${id || text.substring(0, 30)}...`);
          const ttsUrl = `https://tts.thecliff.io.vn/stream`;
          const response = await fetch(ttsUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ text, voice_id })
          });

          if (response.ok && response.body) {
            const { Readable } = await import("stream");
            const { pipeline } = await import("stream/promises");
            const dest = fs.createWriteStream(filepath);
            // @ts-ignore
            const readableStream = Readable.fromWeb(response.body);
            
            await pipeline(readableStream, dest);
            console.log(`[TTS Scan] Saved: ${filename}`);
          } else {
            console.warn(`[TTS Scan] Failed API for: ${filename}`);
          }
        } catch (e) {
          console.error(`[TTS Scan] Error processing text:`, e);
        }
      }
      console.log(`[TTS Scan] Completed processing ${texts.length} items.`);
    })();
  });

  // API Endpoint to scrape room gallery from The Cliff Resort website
  app.post("/api/scrape-room", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || !url.includes("thecliffresort.com.vn")) {
        return res.status(400).json({ error: "Invalid URL. Must be a thecliffresort.com.vn URL." });
      }

      console.log(`[Scrape] Fetching URL: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch page, status: ${response.status}`);
      }

      const html = await response.text();
      
      // Extract const galleryItems = [...]
      const match = html.match(/const galleryItems\s*=\s*(\[.*?\]);/s);
      if (!match || !match[1]) {
        return res.status(404).json({ error: "Could not find gallery items on the page." });
      }

      // Instead of eval, we can use a safer approach but since the format is simple JS objects
      // We will parse it safely using regex to find src properties.
      const itemsString = match[1];
      
      const images: string[] = [];
      let videoUrl: string | null = null;
      
      // Extract {type: 'video', src: '...'} or {type: 'image', src: '...'}
      const regex = /\{[^}]*type:\s*'([^']+)'[^}]*src:\s*'([^']+)'/g;
      let m;
      while ((m = regex.exec(itemsString)) !== null) {
        const type = m[1];
        const src = m[2];
        
        if (type === 'video' && !videoUrl) {
          // Keep only the first video
          videoUrl = src;
        } else if (type === 'image' && images.length < 10) {
          // Keep up to 10 images
          images.push(src);
        }
      }

      const results = [];
      if (videoUrl) {
        // Convert watch?v= format to embed format or keep as is, frontend can handle watch?v=
        results.push(videoUrl);
      }
      results.push(...images);

      if (results.length === 0) {
        return res.status(404).json({ error: "Found gallery items but failed to parse URLs." });
      }

      return res.json({ success: true, urls: results });
    } catch (error: any) {
      console.error("[Scrape] Error:", error);
      return res.status(500).json({ error: error.message || "Failed to scrape URL" });
    }
  });

  // Vite middleware for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
