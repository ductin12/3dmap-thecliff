import fs from 'fs';

export function extractDriveId(url: string): { type: 'folder' | 'file'; id: string } | null {
  if (!url || typeof url !== 'string') return null;
  const cleanUrl = url.trim();

  // Folder matches
  const folderRegexes = [
    /\/drive\/(?:u\/\d+\/)?folders\/([a-zA-Z0-9_-]+)/,
    /\/drive\/folders\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)(?:&.*)?$/,
  ];
  for (const regex of folderRegexes) {
    const m = cleanUrl.match(regex);
    if (m && (cleanUrl.includes('folder') || cleanUrl.includes('drive.google.com'))) {
      return { type: 'folder', id: m[1] };
    }
  }

  // Single file matches
  const fileRegexes = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
    /\/uc\?(?:export=download&)?id=([a-zA-Z0-9_-]+)/,
  ];
  for (const regex of fileRegexes) {
    const m = cleanUrl.match(regex);
    if (m) {
      return { type: 'file', id: m[1] };
    }
  }

  return null;
}

export interface DriveItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  mimeType?: string;
  thumbnailUrl: string;
  downloadUrl: string;
}

export async function scanDriveFolder(folderId: string): Promise<{
  success: boolean;
  folderName?: string;
  items: DriveItem[];
  error?: string;
}> {
  try {
    const url = `https://drive.google.com/embeddedfolderview?id=${folderId}#list`;
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!response.ok) {
      // Try fallback direct drive.google.com/drive/folders/
      return await scanDriveFolderFallback(folderId);
    }

    const html = await response.text();
    const items: DriveItem[] = [];

    // 1. Parse flip-entry divs if present
    // <div class="flip-entry" id="entry-1a2b3c...">
    // <div class="flip-entry-title">filename.jpg</div>
    const entryRegex = /id="entry-([a-zA-Z0-9_-]+)"[^>]*>.*?class="flip-entry-title"[^>]*>([^<]+)<\/div>/gs;
    let match;
    while ((match = entryRegex.exec(html)) !== null) {
      const id = match[1];
      const name = match[2].trim();
      const lower = name.toLowerCase();

      const isVideo = lower.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v|3gp)$/) || false;
      const isImage = lower.match(/\.(jpg|jpeg|png|webp|gif|bmp|svg|heic|tiff)$/) || false;

      if (isVideo || isImage) {
        items.push({
          id,
          name,
          type: isVideo ? 'video' : 'image',
          thumbnailUrl: `https://lh3.googleusercontent.com/d/${id}=w400`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
        });
      }
    }

    // 2. Also try JSON / data attributes regex if flip-entry didn't find all
    if (items.length === 0) {
      return await scanDriveFolderFallback(folderId, html);
    }

    return {
      success: true,
      items,
    };
  } catch (error: any) {
    return {
      success: false,
      items: [],
      error: error.message || 'Failed to scan Google Drive folder',
    };
  }
}

async function scanDriveFolderFallback(folderId: string, initialHtml?: string): Promise<{
  success: boolean;
  folderName?: string;
  items: DriveItem[];
  error?: string;
}> {
  try {
    let html = initialHtml;
    if (!html) {
      const res = await fetch(`https://drive.google.com/drive/folders/${folderId}`, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });
      html = await res.text();
    }

    const items: DriveItem[] = [];
    const seenIds = new Set<string>();

    // Search for array patterns: ["id", "name", "mimeType"] or [null,null,"id","name"]
    // Pattern in Google Drive SSR: [["[a-zA-Z0-9_-]{20,}", ... "image/..."]
    const fileIdNameRegex = /\["(?<id>[a-zA-Z0-9_-]{25,45})",\s*\["(?<name>[^"]+\.(?:jpg|jpeg|png|webp|gif|mp4|mov|avi|webm|mkv))"/gi;
    let m;
    while ((m = fileIdNameRegex.exec(html)) !== null) {
      const id = m.groups?.id;
      const name = m.groups?.name;
      if (id && name && !seenIds.has(id)) {
        seenIds.add(id);
        const lower = name.toLowerCase();
        const isVideo = !!lower.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v|3gp)$/);
        items.push({
          id,
          name,
          type: isVideo ? 'video' : 'image',
          thumbnailUrl: `https://lh3.googleusercontent.com/d/${id}=w400`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
        });
      }
    }

    // Secondary regex for [null, "filename.jpg", "id", ...]
    const genericMatch = /\["([a-zA-Z0-9_-]{28,40})",\["([^"]+\.(?:jpg|jpeg|png|webp|gif|mp4|mov|avi|webm|mkv))"/gi;
    while ((m = genericMatch.exec(html)) !== null) {
      const id = m[1];
      const name = m[2];
      if (id && name && !seenIds.has(id)) {
        seenIds.add(id);
        const lower = name.toLowerCase();
        const isVideo = !!lower.match(/\.(mp4|mov|avi|mkv|webm|wmv|flv|m4v|3gp)$/);
        items.push({
          id,
          name,
          type: isVideo ? 'video' : 'image',
          thumbnailUrl: `https://lh3.googleusercontent.com/d/${id}=w400`,
          downloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
        });
      }
    }

    return {
      success: true,
      items,
    };
  } catch (err: any) {
    return {
      success: false,
      items: [],
      error: err.message,
    };
  }
}
