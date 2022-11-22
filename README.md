# expo-filedownload

expo-filedownload makes it easy to download and save files to your mobile device's local storage.
Currently supported formats include png, jpg, pdf, mp3, mp4, and more.

## Installation

```sh
npm install expo-filedownload
```

## Usage

```js
import { downloadFile } from 'expo-filedownload'

// ...

export default function App() {

    const [isLoading, setIsLoading] = useState(false)

    const JPG_URL = { url: "https://i.imgur.com/CzXTtJV.jpg" }
    const PDF_URL = { url: "http://www.pdf995.com/samples/pdf.pdf" }

    const handleDownload = () => {
        setIsLoading(true)
        downloadFile(JPG_URL.url)
            .then(() => setIsLoading(false))
            .catch(err => { console.log(err), setIsLoading(false) })
    }

    if (isLoading) {
        return (
            <ActivityIndicator />
        )
    }

    return (
        <Button title='download' onPress={handleDownload} />
    )
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---
