import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export async function downloadDriveFile(
  fileId: string,
  fileName: string,
  type: 'image' | 'video',
  targetDir: string
): Promise<{ success: boolean; url: string; localPath?: string; error?: string }> {
  try {
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const cleanName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const destFileName = `gdrive-${fileId}-${cleanName}`;
    const destPath = path.join(targetDir, destFileName);
    const publicUrl = `/data/gdrive/${destFileName}`;

    // If already downloaded, return existing url
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 0) {
      return { success: true, url: publicUrl, localPath: destPath };
    }

    // Attempt 1: Fetch via high-res Google User Content (Fastest & most reliable for images)
    let downloadUrl = type === 'image' 
      ? `https://lh3.googleusercontent.com/d/${fileId}=w2048`
      : `https://drive.usercontent.google.com/download?id=${fileId}&export=download&authuser=0`;

    let response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    // Attempt 2: If attempt 1 fails or returns non-200, try standard export=download
    if (!response.ok || !response.body) {
      downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
      response = await fetch(downloadUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    }

    // Check if Google Drive returned virus scan warning confirmation html
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html') && type === 'video') {
      const htmlText = await response.text();
      const confirmMatch = htmlText.match(/confirm=([0-9a-zA-Z_-]+)/) || htmlText.match(/name="confirm" value="([^"]+)"/);
      if (confirmMatch) {
        const confirmToken = confirmMatch[1];
        const confirmUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmToken}`;
        response = await fetch(confirmUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      }
    }

    if (response.ok && response.body) {
      const dest = fs.createWriteStream(destPath);
      // @ts-ignore
      const readableStream = Readable.fromWeb(response.body);
      await pipeline(readableStream, dest);

      // Verify file was written with content
      if (fs.existsSync(destPath) && fs.statSync(destPath).size > 100) {
        return { success: true, url: publicUrl, localPath: destPath };
      }
    }

    // Fallback: If disk write is not available or direct download failed, use direct CDN url
    const fallbackUrl = type === 'image' 
      ? `https://lh3.googleusercontent.com/d/${fileId}=w2048`
      : `https://drive.google.com/file/d/${fileId}/preview`;

    return { success: true, url: fallbackUrl };
  } catch (error: any) {
    console.error(`[GDrive Download Error ${fileId}]:`, error);
    // Fallback gracefully to direct view URL so user still gets the image/video
    const fallbackUrl = type === 'image' 
      ? `https://lh3.googleusercontent.com/d/${fileId}=w2048`
      : `https://drive.google.com/file/d/${fileId}/preview`;

    return { success: true, url: fallbackUrl };
  }
}
