import { useState, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

export interface DownloadOptions {
  url: string;
  fileName?: string;
  saveToGallery?: boolean;
  albumName?: string;
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
  cache?: boolean;
}

export interface DownloadResult {
  uri: string;
  fileName: string;
  mimeType: string | null;
  cached?: boolean;
}

export class DownloadError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
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

async function saveToMediaLibrary(uri: string, albumName: string) {
  // writeOnly: saving is the only media library operation performed
  const { status } = await MediaLibrary.requestPermissionsAsync(true);

  if (status !== 'granted') {
    throw new DownloadError(
      'Media library permission denied',
      'PERMISSION_DENIED'
    );
  }

  const asset = await MediaLibrary.createAssetAsync(uri);
  const album = await MediaLibrary.getAlbumAsync(albumName);

  if (album === null) {
    await MediaLibrary.createAlbumAsync(albumName, asset, false);
  } else {
    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
  }
}

async function performDownload(
  options: DownloadOptions,
  onResumableCreated?: (resumable: FileSystem.DownloadResumable) => void
): Promise<DownloadResult> {
  const {
    url,
    fileName: customFileName,
    saveToGallery = false,
    albumName = 'Download',
    onProgress,
    headers,
    cache = false,
  } = options;

  if (!url) {
    throw new DownloadError('URL is required', 'INVALID_URL');
  }

  // documentDirectory is null on platforms without a writable directory (web)
  const directory = FileSystem.documentDirectory;
  if (!directory) {
    throw new DownloadError(
      'No writable document directory available on this platform',
      'UNAVAILABLE'
    );
  }

  const fileName = generateFileName(url, customFileName);
  const fileUri = `${directory}${fileName}`;
  const extension = getFileExtension(url);
  const mimeType = getMimeType(extension);

  // Reuse existing file when caching is enabled
  if (cache) {
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    if (fileInfo.exists) {
      return {
        uri: fileUri,
        fileName,
        mimeType,
        cached: true,
      };
    }
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    fileUri,
    headers ? { headers } : {},
    onProgress
      ? (downloadProgress) => {
          const { totalBytesWritten, totalBytesExpectedToWrite } =
            downloadProgress;
          // totalBytesExpectedToWrite is -1 when the server omits Content-Length
          if (totalBytesExpectedToWrite > 0) {
            onProgress(
              Math.min(totalBytesWritten / totalBytesExpectedToWrite, 1)
            );
          }
        }
      : undefined
  );

  onResumableCreated?.(downloadResumable);

  const downloadResult = await downloadResumable.downloadAsync();

  if (!downloadResult) {
    throw new DownloadError('Download failed', 'DOWNLOAD_FAILED');
  }

  if (saveToGallery) {
    await saveToMediaLibrary(downloadResult.uri, albumName);
  }

  return {
    uri: downloadResult.uri,
    fileName,
    mimeType,
    cached: false,
  };
}

/**
 * Download file from URL
 */
export async function downloadFile(
  urlOrOptions: string | DownloadOptions
): Promise<DownloadResult> {
  // Handle both string URL and options object
  const options: DownloadOptions =
    typeof urlOrOptions === 'string' ? { url: urlOrOptions } : urlOrOptions;

  try {
    return await performDownload(options);
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

// ============================================================================
// Hook API
// ============================================================================

export interface UseDownloadOptions {
  saveToGallery?: boolean;
  albumName?: string;
  fileName?: string;
  headers?: Record<string, string>;
  cache?: boolean;
}

export interface UseDownloadReturn {
  download: (url: string, options?: UseDownloadOptions) => Promise<void>;
  cancel: () => void;
  isDownloading: boolean;
  progress: number;
  error: DownloadError | null;
  result: DownloadResult | null;
  reset: () => void;
}

/**
 * React hook for downloading files with automatic state management
 *
 * @example
 * ```tsx
 * const { download, cancel, isDownloading, progress } = useDownload();
 *
 * <Button
 *   onPress={() => download('https://example.com/image.jpg')}
 *   disabled={isDownloading}
 * >
 *   {isDownloading ? `${Math.round(progress * 100)}%` : 'Download'}
 * </Button>
 * <Button onPress={cancel}>Cancel</Button>
 * ```
 */
export function useDownload(
  defaultOptions?: UseDownloadOptions
): UseDownloadReturn {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<DownloadError | null>(null);
  const [result, setResult] = useState<DownloadResult | null>(null);
  const downloadResumableRef = useRef<FileSystem.DownloadResumable | null>(
    null
  );
  const cancelledRef = useRef(false);

  const reset = useCallback(() => {
    setIsDownloading(false);
    setProgress(0);
    setError(null);
    setResult(null);
    downloadResumableRef.current = null;
    cancelledRef.current = false;
  }, []);

  const cancel = useCallback(() => {
    const resumable = downloadResumableRef.current;
    if (resumable) {
      cancelledRef.current = true;
      downloadResumableRef.current = null;
      resumable.cancelAsync().catch(() => {
        // Cancellation errors are irrelevant; the download is being discarded
      });
      setIsDownloading(false);
      setError(new DownloadError('Download cancelled', 'CANCELLED'));
    }
  }, []);

  const download = useCallback(
    async (url: string, options?: UseDownloadOptions) => {
      setIsDownloading(true);
      setProgress(0);
      setError(null);
      setResult(null);
      cancelledRef.current = false;

      try {
        const finalResult = await performDownload(
          {
            url,
            fileName: options?.fileName ?? defaultOptions?.fileName,
            saveToGallery:
              options?.saveToGallery ?? defaultOptions?.saveToGallery,
            albumName: options?.albumName ?? defaultOptions?.albumName,
            headers: options?.headers ?? defaultOptions?.headers,
            cache: options?.cache ?? defaultOptions?.cache,
            onProgress: setProgress,
          },
          (resumable) => {
            downloadResumableRef.current = resumable;
          }
        );

        setResult(finalResult);
        downloadResumableRef.current = null;
      } catch (err: any) {
        const downloadError = cancelledRef.current
          ? new DownloadError('Download cancelled', 'CANCELLED')
          : err instanceof DownloadError
            ? err
            : new DownloadError(
                err.message || 'An unknown error occurred',
                'UNKNOWN_ERROR'
              );
        setError(downloadError);
        downloadResumableRef.current = null;
        throw downloadError;
      } finally {
        setIsDownloading(false);
      }
    },
    [defaultOptions]
  );

  return {
    download,
    cancel,
    isDownloading,
    progress,
    error,
    result,
    reset,
  };
}
