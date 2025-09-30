# expodl

A lightweight, modern utility to download and save files to your mobile device's local storage with Expo.

## Features

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

### Basic Usage

```typescript
import { downloadFile } from 'expodl';

// Simple download with auto-save to gallery
await downloadFile('https://example.com/image.jpg');
```

### Advanced Usage

```typescript
import { downloadFile, DownloadError } from 'expodl';

try {
  const result = await downloadFile({
    url: 'https://example.com/video.mp4',
    fileName: 'my-video.mp4',
    saveToGallery: true,
    albumName: 'My Downloads',
    onProgress: (progress) => {
      console.log(`Download progress: ${Math.round(progress * 100)}%`);
    }
  });

  console.log('Downloaded:', result.uri);
  console.log('MIME type:', result.mimeType);
} catch (error) {
  if (error instanceof DownloadError) {
    console.error(`Download failed: ${error.message} (${error.code})`);
  }
}
```

### With React State

```typescript
import React, { useState } from 'react';
import { View, Button, ActivityIndicator, Text } from 'react-native';
import { downloadFile } from 'expodl';

export default function App() {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadFile({
        url: 'https://example.com/file.pdf',
        onProgress: (p) => setProgress(p)
      });
      alert('Download complete!');
    } catch (error) {
      alert('Download failed');
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <View>
      {isDownloading ? (
        <>
          <ActivityIndicator />
          <Text>{Math.round(progress * 100)}%</Text>
        </>
      ) : (
        <Button title="Download File" onPress={handleDownload} />
      )}
    </View>
  );
}
```

## API Reference

### `downloadFile(urlOrOptions)`

Downloads a file from a URL and optionally saves it to the device gallery.

#### Parameters

- `urlOrOptions`: `string | DownloadOptions`
  - If string: The URL to download (saves to gallery by default)
  - If object: Configuration options

#### DownloadOptions

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

## Migration from v0.x

The new API is backward compatible. Old code will continue to work:

```typescript
// Old way (still works)
await downloadFile('https://example.com/image.jpg');

// New way (recommended)
await downloadFile({
  url: 'https://example.com/image.jpg',
  onProgress: (p) => console.log(p)
});
```

## Examples

### Download without saving to gallery

```typescript
const result = await downloadFile({
  url: 'https://example.com/temp.jpg',
  saveToGallery: false
});
// File is in app's document directory only
console.log(result.uri);
```

### Custom album name

```typescript
await downloadFile({
  url: 'https://example.com/photo.jpg',
  albumName: 'My Vacation Photos'
});
```

### Error handling

```typescript
import { downloadFile, DownloadError } from 'expodl';

try {
  await downloadFile('https://example.com/file.pdf');
} catch (error) {
  if (error instanceof DownloadError) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        alert('Please grant media library permissions');
        break;
      case 'DOWNLOAD_FAILED':
        alert('Download failed. Check your connection.');
        break;
      default:
        alert('An error occurred');
    }
  }
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with ❤️ for the Expo community
