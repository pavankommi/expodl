# expo-filedownload

download and save files to local storage.

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

    const IMAGE_URL = { url: "https://i.imgur.com/CzXTtJV.jpg" }
    const PDF_URL = { url: "http://www.pdf995.com/samples/pdf.pdf" }

    const handleDownload = () => {
        setIsLoading(true)
        downloadFile(IMAGE_URL.url)
            .then(() => setIsLoading(false))
            .catch(err => { console.log(err), setIsLoading(false) })
    }

    return (
        <View style={styles.container}>
            {
                isLoading ? <Text>Handle your loader here</Text> : <Button title='download' onPress={handleDownload} />
            }
        </View>
    );
}
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---
