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

  // Ensure data/gdrive directory exists
  const gdriveDir = path.join(process.cwd(), "data", "gdrive");
  if (!fs.existsSync(gdriveDir)) {
    fs.mkdirSync(gdriveDir, { recursive: true });
  }

  // API Endpoint: Scan Google Drive Folder / File
  app.post("/api/gdrive/scan", async (req, res) => {
    try {
      const { url } = req.body;
      if (!url || typeof url !== "string") {
        return res.status(400).json({ error: "URL is required" });
      }

      const cleanUrl = url.trim();

      const isFolder = cleanUrl.includes("/folders/") || cleanUrl.includes("embeddedfolderview") || (cleanUrl.includes("drive/folders") && !cleanUrl.includes("/file/d/"));
      let folderId = "";

      if (isFolder) {
        const folderMatches = [
          /\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
          /\/drive\/folders\/([a-zA-Z0-9_-]+)/,
          /[?&]id=([a-zA-Z0-9_-]+)(?:&.*)?$/,
        ];

        for (const reg of folderMatches) {
          const m = cleanUrl.match(reg);
          if (m) {
            folderId = m[1];
            break;
          }
        }
      }

      // Check if it's a single file link (image or video)
      if (!folderId) {
        const fileMatches = [
          /\/file\/d\/([a-zA-Z0-9_-]+)/,
          /\/d\/([a-zA-Z0-9_-]+)/,
          /\/uc\?(?:export=download&)?id=([a-zA-Z0-9_-]+)/,
          /[?&]id=([a-zA-Z0-9_-]+)/,
        ];

        let singleId = "";
        for (const reg of fileMatches) {
          const m = cleanUrl.match(reg);
          if (m) {
            singleId = m[1];
            break;
          }
        }

        if (singleId) {
          let fileName = `Drive_File_${singleId.substring(0, 6)}`;
          let isVideo = false;

          try {
            const viewRes = await fetch(`https://drive.google.com/file/d/${singleId}/view`, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              },
            });
            if (viewRes.ok) {
              const html = await viewRes.text();
              const titleMatch = html.match(/<meta\s+itemprop="name"\s+content="([^"]+)"/i) ||
                                 html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
                                 html.match(/<title>([^<]+?)(?:\s*-\s*Google Drive)?<\/title>/i) ||
                                 html.match(/itemJson:\s*\[null,"([^"]+)"/);
              if (titleMatch && titleMatch[1]) {
                fileName = titleMatch[1].trim();
              }

              const lowerName = fileName.toLowerCase();
              const hasVideoExt = !!lowerName.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v|3gp)$/);
              const hasVideoMime = html.includes("video/mp4") || html.includes("video/") || html.includes("type=\"video");
              isVideo = hasVideoExt || hasVideoMime;
            }
          } catch (_e) {}

          const item = {
            id: singleId,
            name: fileName,
            type: isVideo ? "video" : "image",
            thumbnailUrl: isVideo 
              ? `https://drive.google.com/thumbnail?id=${singleId}&sz=w400`
              : `https://lh3.googleusercontent.com/d/${singleId}=w400`,
            downloadUrl: isVideo
              ? `https://drive.google.com/file/d/${singleId}/preview`
              : `https://lh3.googleusercontent.com/d/${singleId}=w2048`,
          };

          return res.json({
            success: true,
            isSingleFile: true,
            folderName: isVideo ? `Video: ${fileName}` : `Ảnh: ${fileName}`,
            totalFiles: 1,
            totalImages: isVideo ? 0 : 1,
            totalVideos: isVideo ? 1 : 0,
            images: isVideo ? [] : [item],
            videos: isVideo ? [item] : [],
          });
        }

        return res.status(400).json({ error: "Không tìm thấy ID thư mục hoặc tệp Google Drive hợp lệ từ đường dẫn." });
      }

      console.log(`[GDrive Scan] Scanning folder ID: ${folderId}`);
      
      // Fetch Google Drive embedded view
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

      // 1. Try parse flip-entry structure
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

      // 2. Try parse SSR data structures if flip-entry found nothing
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

      // Extract folder name if present
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
      console.error("[GDrive Scan Error]:", error);
      return res.status(500).json({ error: error.message || "Lỗi khi quét thư mục Google Drive." });
    }
  });

  // API Endpoint: Import Selected Files from Google Drive
  app.post("/api/gdrive/import", async (req, res) => {
    try {
      const { items } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Missing items array" });
      }

      const importedSlides: any[] = [];
      const { Readable } = await import("stream");
      const { pipeline } = await import("stream/promises");

      for (const item of items) {
        const { id, name, type } = item;
        const cleanName = (name || `file_${id}`).replace(/[^a-zA-Z0-9._-]/g, "_");
        const ext = path.extname(cleanName) || (type === "video" ? ".mp4" : ".jpg");
        const destFileName = `gdrive-${id}${ext}`;
        const destPath = path.join(gdriveDir, destFileName);
        const publicUrl = `/data/gdrive/${destFileName}`;

        let finalUrl = publicUrl;

        // If file not cached yet, download it
        if (!fs.existsSync(destPath) || fs.statSync(destPath).size === 0) {
          try {
            let downloadUrl = type === "image"
              ? `https://lh3.googleusercontent.com/d/${id}=w2048`
              : `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;

            let fetchRes = await fetch(downloadUrl, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            });

            if (!fetchRes.ok || !fetchRes.body) {
              downloadUrl = `https://drive.google.com/uc?export=download&id=${id}`;
              fetchRes = await fetch(downloadUrl, {
                headers: {
                  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                },
              });
            }

            // Handle virus scan warning page if any
            const cType = fetchRes.headers.get("content-type") || "";
            if (cType.includes("text/html") && type === "video") {
              const htmlText = await fetchRes.text();
              const confirmMatch = htmlText.match(/confirm=([0-9a-zA-Z_-]+)/) || htmlText.match(/name="confirm" value="([^"]+)"/);
              if (confirmMatch) {
                const confirmUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=${confirmMatch[1]}`;
                fetchRes = await fetch(confirmUrl, {
                  headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                  },
                });
              }
            }

            if (fetchRes.ok && fetchRes.body) {
              const dest = fs.createWriteStream(destPath);
              // @ts-ignore
              const readableStream = Readable.fromWeb(fetchRes.body);
              await pipeline(readableStream, dest);
            } else {
              // Fallback to high-res direct CDN url
              finalUrl = type === "image"
                ? `https://lh3.googleusercontent.com/d/${id}=w2048`
                : `https://drive.google.com/file/d/${id}/preview`;
            }
          } catch (dlErr) {
            console.warn(`[GDrive Download Warning ${id}]:`, dlErr);
            finalUrl = type === "image"
              ? `https://lh3.googleusercontent.com/d/${id}=w2048`
              : `https://drive.google.com/file/d/${id}/preview`;
          }
        }

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
      console.error("[GDrive Import Error]:", error);
      return res.status(500).json({ error: error.message || "Lỗi khi nhập tệp từ Google Drive." });
    }
  });

  // GET /api/video-stream
  app.get("/api/video-stream", async (req, res) => {
    try {
      const { id } = req.query;
      if (!id || typeof id !== "string") {
        return res.status(400).send("Missing video ID");
      }

      const driveStreamUrl = `https://drive.usercontent.google.com/download?id=${id}&export=download&authuser=0`;
      const headers: Record<string, string> = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      };
      if (req.headers.range) {
        headers["Range"] = req.headers.range;
      }

      const response = await fetch(driveStreamUrl, { headers });
      if (!response.ok && response.status !== 206) {
        const fallbackUrl = `https://drive.google.com/uc?export=download&id=${id}`;
        const fallbackRes = await fetch(fallbackUrl, { headers });
        if (!fallbackRes.ok && fallbackRes.status !== 206) {
          return res.redirect(`https://drive.google.com/file/d/${id}/preview`);
        }
        res.status(fallbackRes.status);
        fallbackRes.headers.forEach((value, key) => {
          if (key.toLowerCase() !== "content-disposition") {
            res.setHeader(key, value);
          }
        });
        res.setHeader("Content-Type", "video/mp4");
        const arrayBuffer = await fallbackRes.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }

      res.status(response.status);
      response.headers.forEach((value, key) => {
        if (key.toLowerCase() !== "content-disposition") {
          res.setHeader(key, value);
        }
      });
      res.setHeader("Content-Type", "video/mp4");
      const arrayBuffer = await response.arrayBuffer();
      return res.send(Buffer.from(arrayBuffer));
    } catch (error: any) {
      console.error("Video stream error:", error);
      return res.status(500).send(error.message);
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
