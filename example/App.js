import React, { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, View } from 'react-native';
import { downloadFile } from 'expo-filedownload'

export default function App() {

    const [isLoading, setIsLoading] = useState(false)

    const JPG_URL = { url: "https://i.imgur.com/CzXTtJV.jpg" }
    const PNG_URL = { url: "https://www.fnordware.com/superpng/pnggrad16rgb.png" }
    const PDF_URL = { url: "http://www.pdf995.com/samples/pdf.pdf" }
    const MP3_URL = { url: "http://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3" }
    const MP4_URL = { url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }

    const handleDownload = () => {
        setIsLoading(true)
        downloadFile(MP3_URL.url)
            .then(() => setIsLoading(false))
            .catch(err => { console.log(err), setIsLoading(false) })
    }

    return (
        <View style={styles.container}>
            {
                isLoading ? <Text>Downloading...</Text> : <Button title='download' onPress={handleDownload} />
            }
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
