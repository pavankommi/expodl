import { renderHook, act } from '@testing-library/react-native';
import { downloadFile, DownloadError, useDownload } from '../index';

// Mock expo modules
const mockFileSystemState: { documentDirectory: string | null } = {
  documentDirectory: 'file:///mock/document/',
};

jest.mock('expo-file-system/legacy', () => ({
  get documentDirectory() {
    return mockFileSystemState.documentDirectory;
  },
  createDownloadResumable: jest.fn(),
  getInfoAsync: jest.fn(),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  getAlbumAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
  addAssetsToAlbumAsync: jest.fn(),
}));

import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';

describe('expodl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('downloadFile', () => {
    it('should download file with string URL', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/download_123.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const result = await downloadFile('https://example.com/image.jpg');

      expect(result).toHaveProperty('uri');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('mimeType', 'image/jpeg');
      expect(mockDownloadAsync).toHaveBeenCalled();
    });

    it('should not touch the media library by default', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/download_123.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      await downloadFile('https://example.com/image.jpg');

      expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
      expect(MediaLibrary.createAssetAsync).not.toHaveBeenCalled();
    });

    it('should download file with options object', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/custom.pdf',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const result = await downloadFile({
        url: 'https://example.com/document.pdf',
        fileName: 'custom.pdf',
      });

      expect(result.fileName).toBe('custom.pdf');
      expect(result.mimeType).toBe('application/pdf');
    });

    it('should track download progress', async () => {
      const onProgress = jest.fn();
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.mp4',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
        (_url, _fileUri, _options, callback) => {
          // Simulate progress
          if (callback) {
            callback({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
          }
          return { downloadAsync: mockDownloadAsync };
        }
      );

      await downloadFile({
        url: 'https://example.com/video.mp4',
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(0.5);
    });

    it('should skip progress updates when total size is unknown', async () => {
      const onProgress = jest.fn();
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.mp4',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
        (_url, _fileUri, _options, callback) => {
          if (callback) {
            // Server omitted Content-Length
            callback({ totalBytesWritten: 50, totalBytesExpectedToWrite: -1 });
          }
          return { downloadAsync: mockDownloadAsync };
        }
      );

      await downloadFile({
        url: 'https://example.com/video.mp4',
        onProgress,
      });

      expect(onProgress).not.toHaveBeenCalled();
    });

    it('should save to gallery when saveToGallery is true', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/temp.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({
        id: 'asset-123',
      });

      (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue({
        id: 'album-123',
      });

      await downloadFile({
        url: 'https://example.com/image.jpg',
        saveToGallery: true,
      });

      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalled();
      expect(MediaLibrary.createAssetAsync).toHaveBeenCalled();
      expect(MediaLibrary.addAssetsToAlbumAsync).toHaveBeenCalled();
    });

    it('should throw DownloadError when URL is missing', async () => {
      await expect(downloadFile({ url: '' })).rejects.toThrow(DownloadError);

      await expect(downloadFile({ url: '' })).rejects.toThrow(
        'URL is required'
      );
    });

    it('should throw DownloadError when permission is denied', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await expect(
        downloadFile({
          url: 'https://example.com/image.jpg',
          saveToGallery: true,
        })
      ).rejects.toThrow('Media library permission denied');
    });

    it('should create new album if it does not exist', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const mockAsset = { id: 'asset-123' };
      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue(mockAsset);
      (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue(null);

      await downloadFile({
        url: 'https://example.com/image.jpg',
        saveToGallery: true,
        albumName: 'Custom Album',
      });

      expect(MediaLibrary.createAlbumAsync).toHaveBeenCalledWith(
        'Custom Album',
        mockAsset,
        false
      );
    });

    it('should handle different file extensions correctly', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.webp',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const result = await downloadFile('https://example.com/image.webp');
      expect(result.mimeType).toBe('image/webp');
    });

    it('should handle URLs with query parameters', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const result = await downloadFile({
        url: 'https://example.com/image.jpg?version=2&token=abc',
      });

      expect(result.fileName).toMatch(/\.jpg$/);
    });

    it('should reuse existing file when cache is enabled', async () => {
      const mockDownloadAsync = jest.fn();

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: true,
      });

      const result = await downloadFile({
        url: 'https://example.com/image.jpg',
        fileName: 'cached.jpg',
        cache: true,
      });

      expect(result.cached).toBe(true);
      expect(mockDownloadAsync).not.toHaveBeenCalled();
    });

    it('should download when cache is enabled but file does not exist', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (FileSystem.getInfoAsync as jest.Mock).mockResolvedValue({
        exists: false,
      });

      const result = await downloadFile({
        url: 'https://example.com/image.jpg',
        cache: true,
      });

      expect(result.cached).toBe(false);
      expect(mockDownloadAsync).toHaveBeenCalled();
    });

    it('should always download when cache is disabled', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const result = await downloadFile({
        url: 'https://example.com/image.jpg',
      });

      expect(FileSystem.getInfoAsync).not.toHaveBeenCalled();
      expect(result.cached).toBe(false);
      expect(mockDownloadAsync).toHaveBeenCalled();
    });

    it('should fall back to .bin extension and null MIME type for extensionless URLs', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/download_123.bin',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const result = await downloadFile('https://example.com/api/files/42');

      expect(result.fileName).toMatch(/\.bin$/);
      expect(result.mimeType).toBe(null);
    });

    it('should write files into documentDirectory', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/report.pdf',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      await downloadFile({
        url: 'https://example.com/report.pdf',
        fileName: 'report.pdf',
      });

      expect(FileSystem.createDownloadResumable).toHaveBeenCalledWith(
        'https://example.com/report.pdf',
        'file:///mock/document/report.pdf',
        {},
        undefined
      );
    });

    it('should throw UNAVAILABLE when documentDirectory is null', async () => {
      mockFileSystemState.documentDirectory = null;

      try {
        await expect(
          downloadFile('https://example.com/image.jpg')
        ).rejects.toMatchObject({ code: 'UNAVAILABLE' });
      } finally {
        mockFileSystemState.documentDirectory = 'file:///mock/document/';
      }
    });

    it('should clamp progress to 1 when written bytes exceed the expected total', async () => {
      const onProgress = jest.fn();
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.mp4',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
        (_url, _fileUri, _options, callback) => {
          if (callback) {
            callback({
              totalBytesWritten: 150,
              totalBytesExpectedToWrite: 100,
            });
          }
          return { downloadAsync: mockDownloadAsync };
        }
      );

      await downloadFile({
        url: 'https://example.com/video.mp4',
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(1);
    });

    it('should skip progress updates when the expected total is zero', async () => {
      const onProgress = jest.fn();
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.mp4',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
        (_url, _fileUri, _options, callback) => {
          if (callback) {
            callback({ totalBytesWritten: 0, totalBytesExpectedToWrite: 0 });
          }
          return { downloadAsync: mockDownloadAsync };
        }
      );

      await downloadFile({
        url: 'https://example.com/video.mp4',
        onProgress,
      });

      expect(onProgress).not.toHaveBeenCalled();
    });

    it('should throw DOWNLOAD_FAILED when downloadAsync resolves to undefined', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue(undefined);

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      await expect(
        downloadFile('https://example.com/image.jpg')
      ).rejects.toMatchObject({ code: 'DOWNLOAD_FAILED' });
    });

    it('should wrap network errors as UNKNOWN_ERROR preserving the message', async () => {
      const mockDownloadAsync = jest
        .fn()
        .mockRejectedValue(new Error('Network request failed'));

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      await expect(
        downloadFile('https://example.com/image.jpg')
      ).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Network request failed',
      });
    });

    it('should wrap non-Error rejections with a fallback message', async () => {
      const mockDownloadAsync = jest.fn().mockRejectedValue('boom');

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      await expect(
        downloadFile('https://example.com/image.jpg')
      ).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
      });
    });

    it('should wrap getInfoAsync failures during cache lookup', async () => {
      (FileSystem.getInfoAsync as jest.Mock).mockRejectedValue(
        new Error('Disk unavailable')
      );

      await expect(
        downloadFile({ url: 'https://example.com/image.jpg', cache: true })
      ).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'Disk unavailable',
      });
    });

    it('should request write-only media library permission', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({
        id: 'asset-123',
      });

      (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue({
        id: 'album-123',
      });

      await downloadFile({
        url: 'https://example.com/image.jpg',
        saveToGallery: true,
      });

      expect(MediaLibrary.requestPermissionsAsync).toHaveBeenCalledWith(true);
    });

    it('should add asset to an existing album without copying', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const mockAsset = { id: 'asset-123' };
      const mockAlbum = { id: 'album-123' };
      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue(mockAsset);
      (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue(mockAlbum);

      await downloadFile({
        url: 'https://example.com/image.jpg',
        saveToGallery: true,
      });

      expect(MediaLibrary.addAssetsToAlbumAsync).toHaveBeenCalledWith(
        [mockAsset],
        mockAlbum,
        false
      );
      expect(MediaLibrary.createAlbumAsync).not.toHaveBeenCalled();
    });

    it('should wrap media library failures after a successful download', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (MediaLibrary.createAssetAsync as jest.Mock).mockRejectedValue(
        new Error('This file type is not supported yet')
      );

      await expect(
        downloadFile({
          url: 'https://example.com/file.pdf',
          saveToGallery: true,
        })
      ).rejects.toMatchObject({
        code: 'UNKNOWN_ERROR',
        message: 'This file type is not supported yet',
      });
    });
  });

  describe('useDownload', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should initialize with default state', () => {
      const { result } = renderHook(() => useDownload());

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.result).toBe(null);
    });

    it('should download file and update state', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const { result } = renderHook(() => useDownload());

      expect(result.current.isDownloading).toBe(false);

      await act(async () => {
        await result.current.download('https://example.com/image.jpg');
      });

      expect(result.current.result).toHaveProperty('uri');
      expect(result.current.error).toBe(null);
      expect(result.current.isDownloading).toBe(false);
    });

    it('should track progress during download', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockImplementation(
        (_url, _fileUri, _options, callback) => {
          if (callback) {
            callback({
              totalBytesWritten: 50,
              totalBytesExpectedToWrite: 100,
            });
          }
          return { downloadAsync: mockDownloadAsync };
        }
      );

      const { result } = renderHook(() => useDownload());

      await act(async () => {
        await result.current.download('https://example.com/image.jpg');
      });

      expect(result.current.progress).toBe(0.5);
      expect(result.current.isDownloading).toBe(false);
    });

    it('should handle download errors', async () => {
      const mockDownloadAsync = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const { result } = renderHook(() => useDownload());

      await act(async () => {
        try {
          await result.current.download('https://example.com/image.jpg');
        } catch (err) {
          // Expected error
        }
      });

      expect(result.current.error).toBeInstanceOf(DownloadError);
      expect(result.current.isDownloading).toBe(false);
    });

    it('should reset state', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const { result } = renderHook(() => useDownload());

      await act(async () => {
        await result.current.download('https://example.com/image.jpg');
      });

      expect(result.current.result).not.toBe(null);

      act(() => {
        result.current.reset();
      });

      expect(result.current.isDownloading).toBe(false);
      expect(result.current.progress).toBe(0);
      expect(result.current.error).toBe(null);
      expect(result.current.result).toBe(null);
    });

    it('should use default options', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/custom.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({
        id: 'asset-123',
      });

      (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue({
        id: 'album-123',
      });

      const { result } = renderHook(() =>
        useDownload({ saveToGallery: true, albumName: 'MyAlbum' })
      );

      await act(async () => {
        await result.current.download('https://example.com/image.jpg');
      });

      expect(MediaLibrary.getAlbumAsync).toHaveBeenCalledWith('MyAlbum');
      expect(result.current.result).not.toBe(null);
    });

    it('should override default options with call options', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const { result } = renderHook(() => useDownload({ saveToGallery: true }));

      await act(async () => {
        await result.current.download('https://example.com/image.jpg', {
          saveToGallery: false,
        });
      });

      expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should support cancellation', async () => {
      const mockCancelAsync = jest.fn().mockResolvedValue(undefined);
      let rejectDownload: (err: Error) => void = () => {};
      const mockDownloadAsync = jest.fn().mockImplementation(
        () =>
          new Promise((_resolve, reject) => {
            rejectDownload = reject;
          })
      );

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
        cancelAsync: mockCancelAsync,
      });

      const { result } = renderHook(() => useDownload());

      let downloadPromise: Promise<void> = Promise.resolve();
      act(() => {
        downloadPromise = result.current.download(
          'https://example.com/image.jpg'
        );
        downloadPromise.catch(() => {
          // Expected rejection after cancel
        });
      });

      expect(result.current.isDownloading).toBe(true);

      act(() => {
        result.current.cancel();
      });

      expect(mockCancelAsync).toHaveBeenCalled();
      expect(result.current.isDownloading).toBe(false);
      expect(result.current.error?.code).toBe('CANCELLED');

      // Native cancellation rejects the pending download; the error stays CANCELLED
      await act(async () => {
        rejectDownload(new Error('Download cancelled by native module'));
        await downloadPromise.catch(() => {});
      });

      expect(result.current.error?.code).toBe('CANCELLED');
    });

    it('should report CANCELLED when downloadAsync resolves undefined after cancel', async () => {
      // Legacy downloadAsync resolves to undefined when the task was cancelled
      const mockCancelAsync = jest.fn().mockResolvedValue(undefined);
      let resolveDownload: (value: unknown) => void = () => {};
      const mockDownloadAsync = jest.fn().mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDownload = resolve;
          })
      );

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
        cancelAsync: mockCancelAsync,
      });

      const { result } = renderHook(() => useDownload());

      let downloadPromise: Promise<void> = Promise.resolve();
      act(() => {
        downloadPromise = result.current.download(
          'https://example.com/image.jpg'
        );
        downloadPromise.catch(() => {});
      });

      act(() => {
        result.current.cancel();
      });

      await act(async () => {
        resolveDownload(undefined);
        await downloadPromise.catch(() => {});
      });

      expect(result.current.error?.code).toBe('CANCELLED');
      await expect(downloadPromise).rejects.toMatchObject({
        code: 'CANCELLED',
      });
    });

    it('should ignore cancel when no download is active', () => {
      const { result } = renderHook(() => useDownload());

      act(() => {
        result.current.cancel();
      });

      expect(result.current.error).toBe(null);
      expect(result.current.isDownloading).toBe(false);
    });

    it('should allow a fresh download after cancellation', async () => {
      const mockCancelAsync = jest.fn().mockResolvedValue(undefined);
      let rejectFirst: (err: Error) => void = () => {};
      const mockDownloadAsync = jest
        .fn()
        .mockImplementationOnce(
          () =>
            new Promise((_resolve, reject) => {
              rejectFirst = reject;
            })
        )
        .mockResolvedValueOnce({ uri: 'file:///mock/document/second.jpg' });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
        cancelAsync: mockCancelAsync,
      });

      const { result } = renderHook(() => useDownload());

      let firstDownload: Promise<void> = Promise.resolve();
      act(() => {
        firstDownload = result.current.download('https://example.com/a.jpg');
        firstDownload.catch(() => {});
      });

      act(() => {
        result.current.cancel();
      });

      await act(async () => {
        rejectFirst(new Error('aborted'));
        await firstDownload.catch(() => {});
      });

      expect(result.current.error?.code).toBe('CANCELLED');

      await act(async () => {
        await result.current.download('https://example.com/b.jpg');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.result).toHaveProperty('uri');
      expect(result.current.isDownloading).toBe(false);
    });

    it('should clear previous error state when starting a new download', async () => {
      const mockDownloadAsync = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ uri: 'file:///mock/document/retry.jpg' });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const { result } = renderHook(() => useDownload());

      await act(async () => {
        await result.current
          .download('https://example.com/image.jpg')
          .catch(() => {});
      });

      expect(result.current.error?.code).toBe('UNKNOWN_ERROR');

      await act(async () => {
        await result.current.download('https://example.com/image.jpg');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.result).toHaveProperty('uri');
    });

    it('should use custom headers', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      await act(async () => {
        await downloadFile({
          url: 'https://example.com/image.jpg',
          headers: { Authorization: 'Bearer token123' },
        });
      });

      expect(FileSystem.createDownloadResumable).toHaveBeenCalledWith(
        'https://example.com/image.jpg',
        expect.any(String),
        { headers: { Authorization: 'Bearer token123' } },
        undefined
      );
    });
  });
});
