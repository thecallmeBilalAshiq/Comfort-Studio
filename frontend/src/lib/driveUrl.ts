export function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;

  // Already a direct image URL or non-Google Drive URL
  if (!url.includes('drive.google.com') && !url.includes('docs.google.com')) {
    return url;
  }

  // Format 1: https://drive.google.com/uc?id=FILE_ID&export=view
  let match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  // Format 2: https://drive.google.com/file/d/FILE_ID/...
  match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  // Format 3: https://drive.google.com/open?id=FILE_ID
  match = url.match(/\/open\?id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  // Format 4: https://drive.google.com/uc?export=view&id=FILE_ID (already correct)
  match = url.match(/\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://drive.google.com/uc?export=view&id=${match[1]}`;
  }

  return url;
}

export function isGoogleDriveUrl(url: string): boolean {
  return url.includes('drive.google.com') || url.includes('docs.google.com');
}
