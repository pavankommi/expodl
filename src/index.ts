import { useState, useCallback, useRef } from 'react';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

export interface DownloadOptions {
  url: string;
  fileName?: string;
  saveToGallery?: boolean;
  albumName?: string;
  onProgress?: (progress: number) => void;
  headers?: Record<string, string>;
  cache?: boolean;
  overwrite?: boolean;
}

export interface DownloadResult {
  uri: string;
  fileName: string;
  mimeType: string | null;
  size?: number;
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

/**
 * Download file from URL
 */
export async function downloadFile(
  urlOrOptions: string | DownloadOptions
): Promise<DownloadResult> {
  // Handle both string URL and options object
  const options: DownloadOptions =
    typeof urlOrOptions === 'string'
      ? { url: urlOrOptions, saveToGallery: true }
      : urlOrOptions;

  const {
    url,
    fileName: customFileName,
    saveToGallery = true,
    albumName = 'Download',
    onProgress,
    headers,
    cache = false,
    overwrite = true,
  } = options;

  if (!url) {
    throw new DownloadError('URL is required', 'INVALID_URL');
  }

  try {
    const fileName = generateFileName(url, customFileName);
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;
    const extension = getFileExtension(url);
    const mimeType = getMimeType(extension);

    // Check if file exists (cache control)
    if (cache && !overwrite) {
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

    // Create download resumable for progress tracking
    const downloadResumable = FileSystem.createDownloadResumable(
      url,
      fileUri,
      headers ? { headers } : {},
      onProgress
        ? (downloadProgress) => {
            const progress =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            onProgress(progress);
          }
        : undefined
    );

    const downloadResult = await downloadResumable.downloadAsync();

    if (!downloadResult) {
      throw new DownloadError('Download failed', 'DOWNLOAD_FAILED');
    }

    const result: DownloadResult = {
      uri: downloadResult.uri,
      fileName,
      mimeType,
      cached: false,
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

// ============================================================================
// Hook API
// ============================================================================

export interface UseDownloadOptions {
  saveToGallery?: boolean;
  albumName?: string;
  fileName?: string;
  headers?: Record<string, string>;
  cache?: boolean;
  overwrite?: boolean;
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

  const reset = useCallback(() => {
    setIsDownloading(false);
    setProgress(0);
    setError(null);
    setResult(null);
    downloadResumableRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    if (downloadResumableRef.current) {
      downloadResumableRef.current.pauseAsync();
      downloadResumableRef.current = null;
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

      try {
        const fileName = generateFileName(
          url,
          options?.fileName ?? defaultOptions?.fileName
        );
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;
        const extension = getFileExtension(url);
        const mimeType = getMimeType(extension);

        // Check cache
        const cache = options?.cache ?? defaultOptions?.cache ?? false;
        const overwrite =
          options?.overwrite ?? defaultOptions?.overwrite ?? true;

        if (cache && !overwrite) {
          const fileInfo = await FileSystem.getInfoAsync(fileUri);
          if (fileInfo.exists) {
            setResult({
              uri: fileUri,
              fileName,
              mimeType,
              cached: true,
            });
            setIsDownloading(false);
            return;
          }
        }

        // Create download resumable
        const headers = options?.headers ?? defaultOptions?.headers;
        const downloadResumable = FileSystem.createDownloadResumable(
          url,
          fileUri,
          headers ? { headers } : {},
          (downloadProgress) => {
            const p =
              downloadProgress.totalBytesWritten /
              downloadProgress.totalBytesExpectedToWrite;
            setProgress(p);
          }
        );

        downloadResumableRef.current = downloadResumable;

        const downloadResult = await downloadResumable.downloadAsync();

        if (!downloadResult) {
          throw new DownloadError('Download failed', 'DOWNLOAD_FAILED');
        }

        const finalResult: DownloadResult = {
          uri: downloadResult.uri,
          fileName,
          mimeType,
          cached: false,
        };

        // Save to gallery if requested
        const saveToGallery =
          options?.saveToGallery ?? defaultOptions?.saveToGallery ?? true;
        if (saveToGallery) {
          const { status } = await MediaLibrary.requestPermissionsAsync();

          if (status !== 'granted') {
            throw new DownloadError(
              'Media library permission denied',
              'PERMISSION_DENIED'
            );
          }

          const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
          const albumName =
            options?.albumName ?? defaultOptions?.albumName ?? 'Download';
          const album = await MediaLibrary.getAlbumAsync(albumName);

          if (album === null) {
            await MediaLibrary.createAlbumAsync(albumName, asset, false);
          } else {
            await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
          }
        }

        setResult(finalResult);
        downloadResumableRef.current = null;
      } catch (err: any) {
        const downloadError =
          err instanceof DownloadError
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
