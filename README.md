# expodownload

> Lightweight Expo file download utility with caching, cancellation, and headers support.

[![npm version](https://badge.fury.io/js/expodownload.svg)](https://www.npmjs.com/package/expodownload)
[![npm downloads](https://img.shields.io/npm/dm/expodownload.svg)](https://www.npmjs.com/package/expodownload)
[![bundle size](https://img.shields.io/bundlephobia/minzip/expodownload)](https://bundlephobia.com/package/expodownload)
[![license](https://img.shields.io/npm/l/expodownload.svg)](https://github.com/pavankommi/expodownload/blob/main/LICENSE)

## Features

- 🎣 **Hook API** – `useDownload()` with built-in state
- ❌ **Cancellation** – stop downloads mid-flight
- 🔐 **Custom Headers** – auth tokens, signed URLs
- 💾 **Smart Caching** – skip re-downloading files

## Installation

```sh
npx expo install expodownload expo-file-system expo-media-library
```

`expo-file-system` and `expo-media-library` are peer dependencies — installing them with `npx expo install` ensures the versions match your Expo SDK.

## Quick Start

```typescript
import { useDownload } from 'expodownload';

export default function App() {
  const { download, isDownloading, progress, cancel } = useDownload();

  return (
    <View>
      <Button
        title={isDownloading ? `${Math.round(progress * 100)}%` : 'Download'}
        onPress={() => download('https://example.com/image.jpg')}
        disabled={isDownloading}
      />
      {isDownloading && <Button title="Cancel" onPress={cancel} />}
    </View>
  );
}
```

That's it! 🎉

## Documentation

- 📖 [API Reference](./docs/api.md) - Complete API documentation
- 💡 [Examples](./docs/examples.md) - Advanced usage examples

## Common Use Cases

### Download with Authentication

```typescript
const { download } = useDownload({
  headers: { Authorization: 'Bearer your-token' },
});

await download('https://api.example.com/protected/file.pdf');
```

### Smart Caching

```typescript
const { download } = useDownload({
  cache: true, // Reuse the file if it already exists
});

await download('https://example.com/avatar.jpg');
```

### Save to Gallery

```typescript
const { download } = useDownload({
  saveToGallery: true, // Off by default
  albumName: 'My Photos',
});

await download('https://example.com/photo.jpg');
```

### Function API (Advanced)

```typescript
import { downloadFile } from 'expodownload';

const result = await downloadFile({
  url: 'https://example.com/file.pdf',
  fileName: 'my-file.pdf',
  onProgress: (progress) => console.log(progress),
});
```

## Requirements

- Expo SDK 54+ (`expo-file-system` 19+, `expo-media-library` 17+)
- React Native 0.76+
- React 18+

For Expo SDK 53 and below, use `expodl@1.x` (this package's previous name).

## Migrating from 1.x

- **Package renamed from `expodl` to `expodownload`.** Uninstall `expodl` and install `expodownload`; imports change accordingly.
- **`saveToGallery` now defaults to `false`.** Downloads land in the app's document directory unless you opt in. Pass `saveToGallery: true` to keep the old behavior (media files only).
- **`overwrite` option removed.** `cache: true` alone now reuses an existing file; omit it to always re-download.
- **`expo-file-system` and `expo-media-library` are peer dependencies.** Install them in your app with `npx expo install`.
- **`cancel()` now actually cancels** the underlying download (previously it only paused), and the pending `download()` promise rejects with code `CANCELLED`.
- **`DownloadResult.size` removed** (it was never populated).

## License

MIT © [Pavan Kommi](https://github.com/pavankommi)
