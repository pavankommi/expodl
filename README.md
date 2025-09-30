# expodl

A lightweight, modern utility to download and save files to your mobile device's local storage with Expo.

## Features

- 🎣 **React Hook API** - Dead simple with `useDownload()`
- 🚀 Simple, clean API
- 📦 Lightweight (only 2 dependencies)
- 💪 TypeScript support
- 📊 Download progress tracking
- 🎯 Proper error handling
- 🔄 Backward compatible

## Installation

```sh
npm install expodl
```

or

```sh
yarn add expodl
```

## Usage

### Hook API (Recommended) 🎣

The simplest way to download files - the hook manages everything for you!

```typescript
import { useDownload } from 'expodl';

export default function App() {
  const { download, isDownloading, progress, error } = useDownload();

  return (
    <View>
      <Button
        title={isDownloading ? `${Math.round(progress * 100)}%` : 'Download'}
        onPress={() => download('https://example.com/image.jpg')}
        disabled={isDownloading}
      />
      {error && <Text>Error: {error.message}</Text>}
    </View>
  );
}
```

That's it! No state management, no complex setup. Just call `download()` and the hook handles everything.

### Hook with Options

```typescript
const { download, isDownloading, progress, result, error, reset } = useDownload({
  saveToGallery: true,
  albumName: 'My Downloads'
});

// Download with default options
await download('https://example.com/photo.jpg');

// Override options per download
await download('https://example.com/temp.pdf', {
  saveToGallery: false,
  fileName: 'document.pdf'
});

// Reset state after download
reset();
```

### Function API (Advanced)

For more control, use the function directly:

```typescript
import { downloadFile } from 'expodl';

const result = await downloadFile({
  url: 'https://example.com/video.mp4',
  fileName: 'my-video.mp4',
  saveToGallery: true,
  albumName: 'My Downloads',
  onProgress: (progress) => {
    console.log(`${Math.round(progress * 100)}%`);
  }
});

console.log('Downloaded:', result.uri);
```

## API Reference

### `useDownload(defaultOptions?)`

React hook for downloading files with automatic state management.

#### Parameters

- `defaultOptions?`: `UseDownloadOptions` - Default options for all downloads

```typescript
interface UseDownloadOptions {
  saveToGallery?: boolean;  // Save to device gallery (default: true)
  albumName?: string;       // Album name (default: 'Download')
  fileName?: string;        // Custom filename
}
```

#### Returns

```typescript
interface UseDownloadReturn {
  download: (url: string, options?: UseDownloadOptions) => Promise<void>;
  isDownloading: boolean;   // Current download state
  progress: number;         // Download progress (0-1)
  error: DownloadError | null;  // Last error
  result: DownloadResult | null; // Last download result
  reset: () => void;        // Reset all state
}
```

### `downloadFile(urlOrOptions)`

Downloads a file from a URL and optionally saves it to the device gallery.

#### Parameters

- `urlOrOptions`: `string | DownloadOptions`
  - If string: The URL to download (saves to gallery by default)
  - If object: Configuration options

```typescript
interface DownloadOptions {
  url: string;                           // Required: URL to download
  fileName?: string;                     // Optional: Custom filename
  saveToGallery?: boolean;              // Optional: Save to gallery (default: true)
  albumName?: string;                   // Optional: Album name (default: 'Download')
  onProgress?: (progress: number) => void; // Optional: Progress callback (0-1)
}
```

#### Returns

```typescript
interface DownloadResult {
  uri: string;           // Local file URI
  fileName: string;      // File name
  mimeType: string | null; // Detected MIME type
}
```

#### Throws

`DownloadError` with error codes:
- `INVALID_URL`: URL is missing or invalid
- `DOWNLOAD_FAILED`: Network or download error
- `PERMISSION_DENIED`: Media library permission denied
- `UNKNOWN_ERROR`: Other errors

## Examples

### Basic Download Button

```typescript
import { useDownload } from 'expodl';

function DownloadButton() {
  const { download, isDownloading, progress } = useDownload();

  return (
    <Button
      onPress={() => download('https://example.com/file.pdf')}
      disabled={isDownloading}
    >
      {isDownloading ? `Downloading ${Math.round(progress * 100)}%` : 'Download PDF'}
    </Button>
  );
}
```

### Multiple Downloads

```typescript
function MultiDownload() {
  const images = useDownload();
  const videos = useDownload();

  return (
    <>
      <Button onPress={() => images.download('https://example.com/photo.jpg')}>
        {images.isDownloading ? `${Math.round(images.progress * 100)}%` : 'Download Image'}
      </Button>

      <Button onPress={() => videos.download('https://example.com/video.mp4')}>
        {videos.isDownloading ? `${Math.round(videos.progress * 100)}%` : 'Download Video'}
      </Button>
    </>
  );
}
```

### Download with Error Handling

```typescript
function SafeDownload() {
  const { download, isDownloading, error, reset } = useDownload();

  const handleDownload = async () => {
    try {
      await download('https://example.com/file.zip');
      Alert.alert('Success', 'File downloaded!');
    } catch (err) {
      // Error is automatically stored in `error` state
      Alert.alert('Failed', error?.message || 'Download failed');
    }
  };

  return (
    <>
      <Button onPress={handleDownload} disabled={isDownloading}>
        Download
      </Button>
      {error && (
        <>
          <Text>Error: {error.message}</Text>
          <Button onPress={reset}>Try Again</Button>
        </>
      )}
    </>
  );
}
```

### Download List with Progress

```typescript
function DownloadList() {
  const { download, isDownloading, progress, result } = useDownload();
  const [downloads, setDownloads] = useState<DownloadResult[]>([]);

  const handleDownload = async (url: string) => {
    await download(url);
    if (result) {
      setDownloads(prev => [...prev, result]);
    }
  };

  return (
    <View>
      {urls.map(url => (
        <Button key={url} onPress={() => handleDownload(url)}>
          Download
        </Button>
      ))}
      {isDownloading && <Text>Progress: {Math.round(progress * 100)}%</Text>}
      {downloads.map(d => <Text key={d.uri}>{d.fileName}</Text>)}
    </View>
  );
}
```

### Custom Album and Filename

```typescript
const { download } = useDownload({
  albumName: 'My Vacation Photos'
});

await download('https://example.com/beach.jpg', {
  fileName: 'vacation-2024.jpg'
});
```

### Download without Saving to Gallery

```typescript
const { download, result } = useDownload();

await download('https://example.com/temp.pdf', {
  saveToGallery: false
});

// File is only in app's document directory
console.log('Temp file:', result?.uri);
```

## Supported File Types

- **Images**: jpg, jpeg, png, gif, webp
- **Videos**: mp4, mov, avi, webm
- **Audio**: mp3
- **Documents**: pdf
- **Others**: All file types are supported (downloaded with generic extension)

## Permissions

This library requires media library permissions to save files to the device gallery. The permissions are requested automatically when needed.

### iOS

Add to your `app.json`:

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

## Why expodl?

**Before expodl:**
```typescript
const [isDownloading, setIsDownloading] = useState(false);
const [progress, setProgress] = useState(0);
const [error, setError] = useState(null);

const handleDownload = async () => {
  setIsDownloading(true);
  setError(null);
  try {
    // ... download logic with progress tracking
  } catch (err) {
    setError(err);
  } finally {
    setIsDownloading(false);
  }
};
```

**With expodl:**
```typescript
const { download, isDownloading, progress, error } = useDownload();

// That's it! One line.
```

## License

MIT

---

Made with ❤️ for the Expo community
