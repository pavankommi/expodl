# API Reference

Complete API documentation for expodl.

## Table of Contents

- [useDownload Hook](#usedownload-hook)
- [downloadFile Function](#downloadfile-function)
- [Types](#types)
- [Error Handling](#error-handling)

---

## useDownload Hook

React hook for downloading files with automatic state management.

### Signature

```typescript
function useDownload(defaultOptions?: UseDownloadOptions): UseDownloadReturn
```

### Parameters

#### `defaultOptions` (optional)

Default options applied to all downloads. Can be overridden per download.

```typescript
interface UseDownloadOptions {
  saveToGallery?: boolean;          // Save to device gallery (default: true)
  albumName?: string;               // Album name (default: 'Download')
  fileName?: string;                // Custom filename
  headers?: Record<string, string>; // Custom HTTP headers
  cache?: boolean;                  // Enable caching (default: false)
  overwrite?: boolean;              // Overwrite cached files (default: true)
}
```

### Returns

```typescript
interface UseDownloadReturn {
  download: (url: string, options?: UseDownloadOptions) => Promise<void>;
  cancel: () => void;               // Cancel active download
  isDownloading: boolean;           // Current download state
  progress: number;                 // Download progress (0-1)
  error: DownloadError | null;      // Last error
  result: DownloadResult | null;    // Last download result
  reset: () => void;                // Reset all state
}
```

### Example

```typescript
const { download, cancel, isDownloading, progress } = useDownload({
  saveToGallery: true,
  albumName: 'Downloads',
  headers: { 'Authorization': 'Bearer token' }
});

// Download with default options
await download('https://example.com/file.pdf');

// Override options for this download
await download('https://example.com/temp.jpg', {
  saveToGallery: false,
  fileName: 'temp-image.jpg'
});

// Cancel active download
cancel();

// Reset state
reset();
```

---

## downloadFile Function

Low-level function for downloading files. Use when you need more control or don't need state management.

### Signature

```typescript
function downloadFile(urlOrOptions: string | DownloadOptions): Promise<DownloadResult>
```

### Parameters

Can accept either a string URL (for simple downloads) or a full options object.

#### String Parameter

```typescript
await downloadFile('https://example.com/image.jpg');
// Equivalent to: downloadFile({ url: '...', saveToGallery: true })
```

#### Options Object

```typescript
interface DownloadOptions {
  url: string;                           // Required: URL to download
  fileName?: string;                     // Optional: Custom filename
  saveToGallery?: boolean;              // Optional: Save to gallery (default: true)
  albumName?: string;                   // Optional: Album name (default: 'Download')
  headers?: Record<string, string>;     // Optional: Custom HTTP headers
  cache?: boolean;                      // Optional: Enable caching (default: false)
  overwrite?: boolean;                  // Optional: Overwrite cached (default: true)
  onProgress?: (progress: number) => void; // Optional: Progress callback (0-1)
}
```

### Returns

```typescript
interface DownloadResult {
  uri: string;           // Local file URI (file://...)
  fileName: string;      // File name
  mimeType: string | null; // Detected MIME type
  size?: number;         // File size in bytes
  cached?: boolean;      // Whether file was served from cache
}
```

### Throws

Throws `DownloadError` with specific error codes. See [Error Handling](#error-handling).

### Example

```typescript
import { downloadFile } from 'expodl';

// Simple download
const result = await downloadFile('https://example.com/image.jpg');
console.log(result.uri);

// Advanced download
const result = await downloadFile({
  url: 'https://api.example.com/file.pdf',
  fileName: 'my-document.pdf',
  saveToGallery: true,
  albumName: 'Documents',
  headers: {
    'Authorization': 'Bearer token123',
    'X-Custom-Header': 'value'
  },
  cache: true,
  overwrite: false,
  onProgress: (progress) => {
    console.log(`${Math.round(progress * 100)}%`);
  }
});

if (result.cached) {
  console.log('Loaded from cache!');
}
```

---

## Types

### DownloadOptions

Configuration options for downloads.

```typescript
interface DownloadOptions {
  url: string;
  fileName?: string;
  saveToGallery?: boolean;
  albumName?: string;
  headers?: Record<string, string>;
  cache?: boolean;
  overwrite?: boolean;
  onProgress?: (progress: number) => void;
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `url` | `string` | **Required** | URL to download |
| `fileName` | `string` | Auto-generated | Custom filename |
| `saveToGallery` | `boolean` | `true` | Save to device gallery |
| `albumName` | `string` | `'Download'` | Gallery album name |
| `headers` | `Record<string, string>` | `undefined` | Custom HTTP headers |
| `cache` | `boolean` | `false` | Enable file caching |
| `overwrite` | `boolean` | `true` | Overwrite existing cached files |
| `onProgress` | `(progress: number) => void` | `undefined` | Progress callback (0-1) |

### DownloadResult

Result of a successful download.

```typescript
interface DownloadResult {
  uri: string;
  fileName: string;
  mimeType: string | null;
  size?: number;
  cached?: boolean;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `uri` | `string` | Local file URI (file://...) |
| `fileName` | `string` | Downloaded file name |
| `mimeType` | `string \| null` | Detected MIME type |
| `size` | `number` | File size in bytes (optional) |
| `cached` | `boolean` | `true` if loaded from cache |

### UseDownloadOptions

Options for `useDownload` hook.

```typescript
interface UseDownloadOptions {
  saveToGallery?: boolean;
  albumName?: string;
  fileName?: string;
  headers?: Record<string, string>;
  cache?: boolean;
  overwrite?: boolean;
}
```

Same as `DownloadOptions` but without `url` (passed to `download()` function) and `onProgress` (handled internally).

### UseDownloadReturn

Return value of `useDownload` hook.

```typescript
interface UseDownloadReturn {
  download: (url: string, options?: UseDownloadOptions) => Promise<void>;
  cancel: () => void;
  isDownloading: boolean;
  progress: number;
  error: DownloadError | null;
  result: DownloadResult | null;
  reset: () => void;
}
```

| Property | Type | Description |
|----------|------|-------------|
| `download` | `function` | Start a download |
| `cancel` | `function` | Cancel active download |
| `isDownloading` | `boolean` | Current download state |
| `progress` | `number` | Download progress (0-1) |
| `error` | `DownloadError \| null` | Last error if any |
| `result` | `DownloadResult \| null` | Last successful result |
| `reset` | `function` | Reset all state |

---

## Error Handling

### DownloadError

Custom error class with error codes.

```typescript
class DownloadError extends Error {
  code: string;
  message: string;
  name: 'DownloadError';
}
```

### Error Codes

| Code | Description | Common Causes |
|------|-------------|---------------|
| `INVALID_URL` | URL is missing or invalid | Empty URL, malformed URL |
| `DOWNLOAD_FAILED` | Network or download error | Network issues, 404, server error |
| `PERMISSION_DENIED` | Media library permission denied | User denied permission |
| `CANCELLED` | Download was cancelled | User called `cancel()` |
| `UNKNOWN_ERROR` | Other errors | Unexpected errors |

### Handling Errors

**With Hook:**

```typescript
const { download, error } = useDownload();

try {
  await download('https://example.com/file.pdf');
} catch (err) {
  // Error is also in `error` state
  console.log(error?.code, error?.message);
}
```

**With Function:**

```typescript
import { downloadFile, DownloadError } from 'expodl';

try {
  await downloadFile('https://example.com/file.pdf');
} catch (err) {
  if (err instanceof DownloadError) {
    switch (err.code) {
      case 'PERMISSION_DENIED':
        alert('Please grant permissions');
        break;
      case 'DOWNLOAD_FAILED':
        alert('Download failed. Check connection.');
        break;
      case 'CANCELLED':
        alert('Download cancelled');
        break;
      default:
        alert('Error: ' + err.message);
    }
  }
}
```

---

## Supported File Types

expodl automatically detects MIME types for common file extensions:

| Extension | MIME Type |
|-----------|-----------|
| `.jpg`, `.jpeg` | `image/jpeg` |
| `.png` | `image/png` |
| `.gif` | `image/gif` |
| `.webp` | `image/webp` |
| `.pdf` | `application/pdf` |
| `.mp3` | `audio/mpeg` |
| `.mp4` | `video/mp4` |
| `.mov` | `video/quicktime` |
| `.avi` | `video/x-msvideo` |
| `.webm` | `video/webm` |

Other file types are supported but `mimeType` will be `null`.

---

## Permissions

### iOS

Add to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
          "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos."
        }
      ]
    ]
  }
}
```

### Android

Permissions are handled automatically by `expo-media-library`.

---

## Advanced Usage

### Progress Tracking

**With Hook:**
```typescript
const { download, progress } = useDownload();

// Progress is automatically tracked
console.log(`${Math.round(progress * 100)}%`);
```

**With Function:**
```typescript
await downloadFile({
  url: 'https://example.com/file.zip',
  onProgress: (p) => console.log(`${Math.round(p * 100)}%`)
});
```

### Custom Headers

Perfect for authenticated downloads:

```typescript
// With hook (all downloads)
const { download } = useDownload({
  headers: {
    'Authorization': 'Bearer token123',
    'X-API-Key': 'key'
  }
});

// Per download
await download(url, {
  headers: { 'Authorization': 'Bearer new-token' }
});
```

### Caching

Skip re-downloading files:

```typescript
// Enable caching, don't overwrite existing
const { download } = useDownload({
  cache: true,
  overwrite: false
});

await download('https://example.com/avatar.jpg', {
  fileName: 'user-123-avatar.jpg'
});

// Second call returns cached file instantly
await download('https://example.com/avatar.jpg', {
  fileName: 'user-123-avatar.jpg'
});
```

### Cancellation

**Only available with hook:**

```typescript
const { download, cancel, isDownloading } = useDownload();

download('https://example.com/large-file.zip');

// Later...
if (isDownloading) {
  cancel(); // Stops download, sets error to CANCELLED
}
```

---

[← Back to README](../README.md) · [Examples →](./examples.md)
