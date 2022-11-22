import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print'
import * as IntentLauncher from 'expo-intent-launcher';
import moment from 'moment';

export const downloadFile = (IMAGE_URI) => {
    let fileExtension = IMAGE_URI.substr(IMAGE_URI.length - 3);
    return new Promise((resolve, reject) => {
        setTimeout(function () {
            var didSucceed = Math.random() >= 0.0;
            downloadFileHandler(IMAGE_URI, fileExtension)
            didSucceed ? resolve(new Date()) : reject('Error');
        }, 500);
    })
}

export const downloadFileHandler = async (IMAGE_URI, fileExtension) => {
    // ToastAndroid.show("download started", ToastAndroid.SHORT);
    let date = moment().format('YYYYMMDDhhmmss')

    let fileUri = FileSystem.documentDirectory + `${date}.${fileExtension}`;

    try {
        const res = await FileSystem.downloadAsync(IMAGE_URI, fileUri)
        saveFile(res.uri, fileExtension)
    } catch (err) {
        console.log("FS Err: ", err)
    }
}

saveFile = async (fileUri, fileExtension) => {

    const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);

    if (status === "granted") {
        try {
            if (fileExtension == "pdf") {
                Print.printAsync({
                    uri: fileUri
                })
                // ToastAndroid.show("download completed", ToastAndroid.SHORT);
            }
            else {
                const asset = await MediaLibrary.createAssetAsync(fileUri);
                const album = await MediaLibrary.getAlbumAsync('Download');
                if (album == null) {
                    await MediaLibrary.createAlbumAsync('Download', asset, false);
                } else {
                    await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                }

                // await MediaLibrary.deleteAssetsAsync(asset)
                try {
                    // ToastAndroid.show("download completed", ToastAndroid.SHORT);
                    FileSystem.getContentUriAsync(fileUri).then(cUri => {
                        IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                            data: cUri,
                            flags: 1,
                            type: 'image/jpeg'
                        });
                    });
                }
                catch {
                    // ToastAndroid.show("download failed", ToastAndroid.SHORT);
                    console.log("not done")
                }
            }
        } catch (err) {
            // ToastAndroid.show("download failed", ToastAndroid.SHORT);
            console.log("Save err: ", err)
        }
    } else if (status === "denied") {
        alert("please allow permissions to download")
    }
}


