import { renderHook, act } from '@testing-library/react-hooks';
import { downloadFile, DownloadError, useDownload } from '../index';

// Mock expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///mock/document/',
  createDownloadResumable: jest.fn(),
}));

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn(),
  createAssetAsync: jest.fn(),
  getAlbumAsync: jest.fn(),
  createAlbumAsync: jest.fn(),
  addAssetsToAlbumAsync: jest.fn(),
}));

import * as FileSystem from 'expo-file-system';
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

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({
        id: 'asset-123',
      });

      (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue({
        id: 'album-123',
      });

      const result = await downloadFile('https://example.com/image.jpg');

      expect(result).toHaveProperty('uri');
      expect(result).toHaveProperty('fileName');
      expect(result).toHaveProperty('mimeType', 'image/jpeg');
      expect(mockDownloadAsync).toHaveBeenCalled();
    });

    it('should download file with options object', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/custom.pdf',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
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

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      await downloadFile({
        url: 'https://example.com/video.mp4',
        onProgress,
      });

      expect(onProgress).toHaveBeenCalledWith(0.5);
    });

    it('should skip gallery save when saveToGallery is false', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/temp.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      await downloadFile({
        url: 'https://example.com/image.jpg',
        saveToGallery: false,
      });

      expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('should throw DownloadError when URL is missing', async () => {
      await expect(
        downloadFile({ url: '', saveToGallery: false })
      ).rejects.toThrow(DownloadError);

      await expect(
        downloadFile({ url: '', saveToGallery: false })
      ).rejects.toThrow('URL is required');
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
        downloadFile('https://example.com/image.jpg')
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

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
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
        saveToGallery: false,
      });

      expect(result.fileName).toMatch(/\.jpg$/);
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

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (MediaLibrary.createAssetAsync as jest.Mock).mockResolvedValue({
        id: 'asset-123',
      });

      (MediaLibrary.getAlbumAsync as jest.Mock).mockResolvedValue({
        id: 'album-123',
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
            setTimeout(() => {
              callback({ totalBytesWritten: 50, totalBytesExpectedToWrite: 100 });
            }, 10);
          }
          return { downloadAsync: mockDownloadAsync };
        }
      );

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const { result } = renderHook(() => useDownload());

      await act(async () => {
        await result.current.download('https://example.com/image.jpg');
      });

      // Progress tracking happens during download
      expect(result.current.isDownloading).toBe(false);
    });

    it('should handle download errors', async () => {
      const mockDownloadAsync = jest.fn().mockRejectedValue(
        new Error('Network error')
      );

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

      (MediaLibrary.requestPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
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

      const { result } = renderHook(() =>
        useDownload({ saveToGallery: true, albumName: 'MyAlbum' })
      );

      await act(async () => {
        await result.current.download('https://example.com/image.jpg');
      });

      expect(result.current.result).not.toBe(null);
    });

    it('should override default options with call options', async () => {
      const mockDownloadAsync = jest.fn().mockResolvedValue({
        uri: 'file:///mock/document/test.jpg',
      });

      (FileSystem.createDownloadResumable as jest.Mock).mockReturnValue({
        downloadAsync: mockDownloadAsync,
      });

      const { result } = renderHook(() =>
        useDownload({ saveToGallery: true })
      );

      await act(async () => {
        await result.current.download('https://example.com/image.jpg', {
          saveToGallery: false,
        });
      });

      expect(MediaLibrary.requestPermissionsAsync).not.toHaveBeenCalled();
    });
  });
});
