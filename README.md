# expodl

> Lightweight Expo file download utility with caching, cancellation, and headers support.

[![npm version](https://badge.fury.io/js/expodl.svg)](https://www.npmjs.com/package/expodl)
[![npm downloads](https://img.shields.io/npm/dm/expodl.svg)](https://www.npmjs.com/package/expodl)
[![bundle size](https://img.shields.io/bundlephobia/minzip/expodl)](https://bundlephobia.com/package/expodl)
[![license](https://img.shields.io/npm/l/expodl.svg)](https://github.com/pavankommi/expodl/blob/main/LICENSE)

## Features

- 🎣 **React Hook API** - Dead simple with `useDownload()`
- ❌ **Cancellation** - Cancel downloads mid-flight
- 🔐 **Custom Headers** - Auth tokens, signed URLs
- 💾 **Smart Caching** - Skip re-downloading
- 📊 **Progress Tracking** - Real-time progress updates
- 🎯 **Error Handling** - Proper error codes
- 📦 **Lightweight** - Only 2 dependencies, 12.1 KB

## Installation

```sh
npm install expodl
```

## Quick Start

```typescript
import { useDownload } from 'expodl';

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
  headers: { 'Authorization': 'Bearer your-token' }
});

await download('https://api.example.com/protected/file.pdf');
```

### Smart Caching

```typescript
const { download } = useDownload({
  cache: true,
  overwrite: false  // Skip if already exists
});

await download('https://example.com/avatar.jpg');
```

### Function API (Advanced)

```typescript
import { downloadFile } from 'expodl';

const result = await downloadFile({
  url: 'https://example.com/file.pdf',
  fileName: 'my-file.pdf',
  onProgress: (progress) => console.log(progress)
});
```


## Requirements

- Expo SDK 47+
- React Native 0.70+

## License

MIT © [Pavan Kommi](https://github.com/pavankommi)

---

Made with ❤️ for the Expo community
