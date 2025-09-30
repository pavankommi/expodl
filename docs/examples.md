# Examples

Advanced usage examples for expodl.

## Table of Contents

- [Download with Cancellation](#download-with-cancellation)
- [Authenticated Downloads](#authenticated-downloads)
- [Smart Caching](#smart-caching)
- [Multiple Downloads](#multiple-downloads)
- [Error Handling](#error-handling)
- [Download List with Progress](#download-list-with-progress)
- [Custom Album and Filename](#custom-album-and-filename)
- [Download without Gallery Save](#download-without-gallery-save)

---

## Download with Cancellation

Allow users to cancel downloads mid-flight:

```typescript
import { useDownload } from 'expodl';

function DownloadWithCancel() {
  const { download, cancel, isDownloading, progress } = useDownload();

  return (
    <View>
      <Button onPress={() => download('https://example.com/large-file.zip')}>
        Start Download
      </Button>
      {isDownloading && (
        <>
          <Text>{Math.round(progress * 100)}%</Text>
          <Button onPress={cancel}>Cancel</Button>
        </>
      )}
    </View>
  );
}
```

---

## Authenticated Downloads

Download files from protected APIs:

```typescript
import { useDownload } from 'expodl';

function AuthenticatedDownload() {
  const { download } = useDownload({
    headers: {
      'Authorization': 'Bearer your-token-here',
      'X-Custom-Header': 'value'
    }
  });

  return (
    <Button onPress={() => download('https://api.example.com/protected/file.pdf')}>
      Download Protected File
    </Button>
  );
}
```

You can also override headers per download:

```typescript
await download('https://api.example.com/file.pdf', {
  headers: {
    'Authorization': `Bearer ${newToken}`
  }
});
```

---

## Smart Caching

Avoid re-downloading files that already exist:

```typescript
import { useDownload } from 'expodl';

function CachedDownload() {
  const { download, result } = useDownload({
    cache: true,
    overwrite: false  // Don't re-download if exists
  });

  const handleDownload = async () => {
    await download('https://example.com/avatar.jpg', {
      fileName: 'user-avatar.jpg'
    });

    if (result?.cached) {
      console.log('Loaded from cache - instant!');
    } else {
      console.log('Downloaded fresh copy');
    }
  };

  return <Button onPress={handleDownload}>Download Avatar</Button>;
}
```

**When to use caching:**
- Profile pictures / avatars
- App assets that rarely change
- Documents with stable URLs
- Any file you want to download once and reuse

---

## Multiple Downloads

Track multiple downloads independently:

```typescript
import { useDownload } from 'expodl';

function MultiDownload() {
  const images = useDownload();
  const videos = useDownload();

  return (
    <>
      <Button onPress={() => images.download('https://example.com/photo.jpg')}>
        {images.isDownloading
          ? `Downloading Image ${Math.round(images.progress * 100)}%`
          : 'Download Image'}
      </Button>

      <Button onPress={() => videos.download('https://example.com/video.mp4')}>
        {videos.isDownloading
          ? `Downloading Video ${Math.round(videos.progress * 100)}%`
          : 'Download Video'}
      </Button>
    </>
  );
}
```

---

## Error Handling

Properly handle download errors:

```typescript
import { useDownload, DownloadError } from 'expodl';

function SafeDownload() {
  const { download, isDownloading, error, reset } = useDownload();

  const handleDownload = async () => {
    try {
      await download('https://example.com/file.zip');
      Alert.alert('Success', 'File downloaded!');
    } catch (err) {
      // Error is automatically stored in `error` state
      if (error?.code === 'PERMISSION_DENIED') {
        Alert.alert('Permission Required', 'Please grant media library access');
      } else if (error?.code === 'CANCELLED') {
        Alert.alert('Cancelled', 'Download was cancelled');
      } else {
        Alert.alert('Error', error?.message || 'Download failed');
      }
    }
  };

  return (
    <>
      <Button onPress={handleDownload} disabled={isDownloading}>
        Download
      </Button>
      {error && (
        <View>
          <Text>Error: {error.message}</Text>
          <Button onPress={reset}>Try Again</Button>
        </View>
      )}
    </>
  );
}
```

**Error Codes:**
- `INVALID_URL` - URL is missing or invalid
- `DOWNLOAD_FAILED` - Network or download error
- `PERMISSION_DENIED` - Media library permission denied
- `CANCELLED` - Download was cancelled
- `UNKNOWN_ERROR` - Other errors

---

## Download List with Progress

Build a download manager:

```typescript
import { useDownload } from 'expodl';
import { useState } from 'react';

function DownloadList() {
  const { download, isDownloading, progress, result } = useDownload();
  const [downloads, setDownloads] = useState<DownloadResult[]>([]);

  const urls = [
    'https://example.com/file1.pdf',
    'https://example.com/file2.pdf',
    'https://example.com/file3.pdf',
  ];

  const handleDownload = async (url: string) => {
    await download(url);
    if (result) {
      setDownloads(prev => [...prev, result]);
    }
  };

  return (
    <View>
      {urls.map(url => (
        <Button
          key={url}
          onPress={() => handleDownload(url)}
          disabled={isDownloading}
        >
          Download
        </Button>
      ))}

      {isDownloading && (
        <Text>Progress: {Math.round(progress * 100)}%</Text>
      )}

      <Text>Downloaded Files:</Text>
      {downloads.map(d => (
        <Text key={d.uri}>{d.fileName}</Text>
      ))}
    </View>
  );
}
```

---

## Custom Album and Filename

Organize downloads into specific albums with custom names:

```typescript
import { useDownload } from 'expodl';

function OrganizedDownload() {
  const { download } = useDownload({
    albumName: 'My Vacation Photos'
  });

  const handleDownload = async () => {
    await download('https://example.com/beach.jpg', {
      fileName: 'vacation-2024-beach.jpg'
    });
  };

  return <Button onPress={handleDownload}>Download Vacation Photo</Button>;
}
```

**Album Tips:**
- Use meaningful album names like "Profile Pictures", "Documents", etc.
- Album is created automatically if it doesn't exist
- Files can be moved between albums later by the user

---

## Download without Gallery Save

Download files to app's document directory only:

```typescript
import { useDownload } from 'expodl';

function TempDownload() {
  const { download, result } = useDownload();

  const handleDownload = async () => {
    await download('https://example.com/temp.pdf', {
      saveToGallery: false  // Only save to app directory
    });

    // File is in app's document directory
    console.log('Temp file:', result?.uri);
    // Use the file (display, share, etc.)
  };

  return <Button onPress={handleDownload}>Download Temporarily</Button>;
}
```

**Use cases:**
- Temporary files that will be processed
- Cache files
- Files for immediate use (share, display)
- Files that shouldn't clutter user's gallery

---

## Using the Function API

For more control, use `downloadFile` directly:

```typescript
import { downloadFile } from 'expodl';

async function advancedDownload() {
  const result = await downloadFile({
    url: 'https://example.com/video.mp4',
    fileName: 'my-video.mp4',
    saveToGallery: true,
    albumName: 'My Videos',
    headers: {
      'Authorization': 'Bearer token123',
      'Custom-Header': 'value'
    },
    cache: true,
    overwrite: false,
    onProgress: (progress) => {
      console.log(`Download: ${Math.round(progress * 100)}%`);
    }
  });

  console.log('Downloaded:', result.uri);
  console.log('From cache?', result.cached);
  console.log('MIME type:', result.mimeType);
}
```

---

## Complete Example App

Here's a full-featured download component:

```typescript
import React, { useState } from 'react';
import { View, Button, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useDownload } from 'expodl';

export default function DownloadManager() {
  const {
    download,
    cancel,
    isDownloading,
    progress,
    error,
    result,
    reset
  } = useDownload({
    cache: true,
    overwrite: false,
    headers: {
      'User-Agent': 'expodl-example'
    }
  });

  const [url, setUrl] = useState('https://i.imgur.com/CzXTtJV.jpg');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Download Manager</Text>

      {!isDownloading && !result && (
        <Button title="Download Image" onPress={() => download(url)} />
      )}

      {isDownloading && (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.progress}>{Math.round(progress * 100)}%</Text>
          <Button title="Cancel" onPress={cancel} color="#ff3b30" />
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error.code === 'CANCELLED'
              ? 'Download cancelled'
              : `Error: ${error.message}`}
          </Text>
          <Button title="Try Again" onPress={reset} />
        </View>
      )}

      {result && (
        <View style={styles.resultContainer}>
          <Text style={styles.success}>✓ Download complete!</Text>
          <Text>File: {result.fileName}</Text>
          <Text>Type: {result.mimeType}</Text>
          {result.cached && <Text>📦 From cache</Text>}
          <Button title="Download Another" onPress={reset} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progress: {
    fontSize: 20,
    marginVertical: 10,
  },
  errorContainer: {
    padding: 20,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    marginBottom: 10,
  },
  resultContainer: {
    padding: 20,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  success: {
    color: '#2e7d32',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
```

---

[← Back to README](../README.md) · [API Reference →](./api.md)
