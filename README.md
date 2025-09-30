# expodl

expodl makes it easy to download and save files to your mobile device's local storage.
Currently supported formats include png, jpg, pdf, mp3, mp4, and more.

## Installation

```sh
npm install expodl
```

## Usage

```js
import { downloadFile } from 'expodl'

// ...

export default function App() {

    const [isLoading, setIsLoading] = useState(false)

    const JPG_URL = { url: "https://i.imgur.com/CzXTtJV.jpg" }

    const handleDownload = () => {
        setIsLoading(true)
        downloadFile(JPG_URL.url)
            .then(() => setIsLoading(false))
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

## URLs to test your downloads
```js
const JPG_URL = { url: "https://i.imgur.com/CzXTtJV.jpg" }
const PNG_URL = { url: "https://www.fnordware.com/superpng/pnggrad16rgb.png" }
const PDF_URL = { url: "http://www.pdf995.com/samples/pdf.pdf" }
const MP3_URL = { url: "http://commondatastorage.googleapis.com/codeskulptor-demos/DDR_assets/Kangaroo_MusiQue_-_The_Neverwritten_Role_Playing_Game.mp3" }
const MP4_URL = { url: "http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" }
```


## Handling expo-notifications with expodl

Push notifications may be easily handled with expodl for a better user experience. Check out the example below to see how to use expodl with expo-notifications.

```js
import React, { useEffect, useState, useRef } from 'react'
import { ActivityIndicator, Button, Text, View } from 'react-native'
import { downloadFile } from 'expodl'
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import storage from "@react-native-async-storage/async-storage";

// ...

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true
    })
});

export default function Home() {

    const [isLoading, setIsLoading] = useState(false)

    const [notification, setNotification] = useState(false);
    const notificationListener = useRef();
    const responseListener = useRef();

    useEffect(() => {
        const getPermission = async () => {
            if (Constants.isDevice) {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                if (finalStatus !== 'granted') {
                    alert('Enable push notifications to use the app!');
                    await storage.setItem('expopushtoken', "");
                    return;
                }
                const token = (await Notifications.getExpoPushTokenAsync()).data;
                await storage.setItem('expopushtoken', token);
            } else {
                alert('Must use physical device for Push Notifications');
            }

            if (Platform.OS === 'android') {
                Notifications.setNotificationChannelAsync('default', {
                    name: 'default',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#FF231F7C',
                });
            }
        }

        getPermission();

        notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener(response => { });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener.current);
            Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    const downloadStartedNoti = async (val) => {
        console.log(val)
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Download started",
                body: "Download started",
                data: { data: "data goes here" }
            },
            trigger: null,
        });
    }

    const downloadCompletedNoti = async () => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: "Download completed",
                body: "Download completed",
                data: { data: "data goes here" }
            },
            trigger: null,
        });
    }

    const JPG_URL = { url: "https://i.imgur.com/CzXTtJV.jpg" }
    const PDF_URL = { url: "http://www.pdf995.com/samples/pdf.pdf" }

    const handleDownload = async () => {
        await downloadStartedNoti("Download started")
        setIsLoading(true)
        downloadFile(JPG_URL.url)
            .then(async () => { setIsLoading(false), await downloadCompletedNoti("Download completed") })
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
