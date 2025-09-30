import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export interface DownloadOptions {
  url: string;
  fileName?: string;
  saveToGallery?: boolean;
  albumName?: string;
  onProgress?: (progress: number) => void;
}

export interface DownloadResult {
  uri: string;
  fileName: string;
  mimeType: string | null;
  size?: number;
}

export class DownloadError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DownloadError';
  }
}

/**
 * Get file extension from URL
 */
function getFileExtension(url: string): string {
  const urlWithoutQuery = url.split('?')[0] || url;
  const match = urlWithoutQuery.match(/\.([a-zA-Z0-9]+)$/);
  return match?.[1]?.toLowerCase() || 'bin';
}

/**
 * Get MIME type from file extension
 */
function getMimeType(extension: string): string | null {
  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    mp3: 'audio/mpeg',
    mp4: 'video/mp4',
    mov: 'video/quicktime',
    avi: 'video/x-msvideo',
    webm: 'video/webm',
  };
  return mimeTypes[extension] || null;
}

/**
 * Generate unique filename with timestamp
 */
function generateFileName(url: string, customName?: string): string {
  if (customName) return customName;

  const extension = getFileExtension(url);
  const timestamp = Date.now();
  return `download_${timestamp}.${extension}`;
}

/**
 * Download file from URL
 */
export async function downloadFile(
  urlOrOptions: string | DownloadOptions
): Promise<DownloadResult> {
  // Handle both string URL and options object
  const options: DownloadOptions = typeof urlOrOptions === 'string'
    ? { url: urlOrOptions, saveToGallery: true }
    : urlOrOptions;

  const {
    url,
    fileName: customFileName,
    saveToGallery = true,
    albumName = 'Download',
    onProgress,
  } = options;

  if (!url) {
    throw new DownloadError('URL is required', 'INVALID_URL');
  }

  try {
    const fileName = generateFileName(url, customFileName);
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const extension = getFileExtension(url);
    const mimeType = getMimeType(extension);

    // Create download resumable for progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      {},
      onProgress ? (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        onProgress(progress);
      } : undefined
    );

    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult) {
      throw new DownloadError('Download failed', 'DOWNLOAD_FAILED');
    }

    const result: DownloadResult = {
      uri: downloadResult.uri,
      fileName,
      mimeType,
    };

    // Save to gallery if requested
    if (saveToGallery) {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        throw new DownloadError(
          'Media library permission denied',
          'PERMISSION_DENIED'
        );
      }

      // Create asset from downloaded file
      const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);

      // Create or get album
      const album = await MediaLibrary.getAlbumAsync(albumName);
      if (album === null) {
        await MediaLibrary.createAlbumAsync(albumName, asset, false);
      } else {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      }
    }

    return result;
  } catch (error: any) {
    if (error instanceof DownloadError) {
      throw error;
    }
    throw new DownloadError(
      error.message || 'An unknown error occurred',
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Legacy function name for backward compatibility
 * @deprecated Use downloadFile instead
 */
export const download = downloadFile;
