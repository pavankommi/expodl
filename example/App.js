import React, { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';
import { downloadFile } from 'expo-filedownload'

export default function App() {

    const [isLoading, setIsLoading] = useState(false)

    const IMAGE_URL = { url: "https://media.voguebusiness.com/photos/5ef6493adf1073db3375835d/2:3/w_2560%2Cc_limit/kanye-west-gap-news-voguebus-mert-alas-and-marcus-piggott-june-20-story.jpg" }
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
                isLoading ? <Text>Downloading...</Text> : <Button title='download' onPress={handleDownload} />
            }
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
