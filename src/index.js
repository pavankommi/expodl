import * as FileSystem from 'expo-file-system';
import * as Permissions from 'expo-permissions';
import * as MediaLibrary from 'expo-media-library';
import * as Print from 'expo-print'
import * as IntentLauncher from 'expo-intent-launcher';
import moment from 'moment';

export const downloadFile = (IMAGE_URI) => {
    let fileExtension = IMAGE_URI.substr(IMAGE_URI.length - 3);
    return new Promise((resolve, reject) => {
        
        setTimeout(async function () {
            
            let date = moment().format('YYYYMMDDhhmmss')

            let fileUri = FileSystem.documentDirectory + `${date}.${fileExtension}`;

            try {
                const res = await FileSystem.downloadAsync(IMAGE_URI, fileUri)
                let fileurl = res.uri
                const { status } = await Permissions.askAsync(Permissions.MEDIA_LIBRARY);

                if (status === "granted") {
                    try {
                        if (fileExtension == "pdf") {
                            Print.printAsync({
                                uri: fileurl
                            })
                            resolve(new Date())
                        }
                        else {
                            const asset = await MediaLibrary.createAssetAsync(fileurl);
                            const album = await MediaLibrary.getAlbumAsync('Download');
                            if (album == null) {
                                await MediaLibrary.createAlbumAsync('Download', asset, false);
                            } else {
                                await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
                            }

                            // await MediaLibrary.deleteAssetsAsync(asset)
                            resolve(new Date())
                            // try {
                               
                            //     if (fileExtension == "jpg" || fileExtension == "png") {
                            //         FileSystem.getContentUriAsync(fileurl).then(cUri => {
                            //             IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                            //                 data: cUri,
                            //                 flags: 1,
                            //                 type: 'image/jpeg'
                            //             });
                            //         });
                            //     } else if (fileExtension == "mp3") {
                            //         FileSystem.getContentUriAsync(fileurl).then(cUri => {
                            //             IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                            //                 data: cUri,
                            //                 flags: 1,
                            //                 type: 'audio/mp3'
                            //             });
                            //         });
                            //     } else if (fileExtension == "mp4") {
                            //         FileSystem.getContentUriAsync(fileurl).then(cUri => {
                            //             IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
                            //                 data: cUri,
                            //                 flags: 1,
                            //                 type: 'video/mp4'
                            //             });
                            //         });
                            //     }
                            // }
                            // catch {
                            //     reject('Error')
                            //     console.log("not done")
                            // }
                        }
                    } catch (err) {
                        resolve(new Date())
                        console.log("Save err: ", err)
                    }
                } else if (status === "denied") {
                    alert("please allow permissions to download")
                }
            } catch (err) {
                console.log("FS Err: ", err)
            }
        }, 500);
    })
}




