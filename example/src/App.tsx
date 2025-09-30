import * as React from 'react';

import { StyleSheet, View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { downloadFile } from 'expodl';

export default function App() {
  const [progress, setProgress] = React.useState(0);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [downloadedUri, setDownloadedUri] = React.useState<string | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadedUri(null);
    try {
      const result = await downloadFile({
        url: 'https://i.imgur.com/CzXTtJV.jpg',
        onProgress: (p) => setProgress(p),
      });
      setDownloadedUri(result.uri);
      Alert.alert('Success', 'Download complete!');
    } catch (error) {
      Alert.alert('Error', 'Download failed: ' + (error as Error).message);
    } finally {
      setIsDownloading(false);
      setProgress(0);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>expodl Example</Text>

      {isDownloading ? (
        <>
          <ActivityIndicator size="large" />
          <Text style={styles.progress}>
            {Math.round(progress * 100)}%
          </Text>
        </>
      ) : (
        <Button title="Download Image" onPress={handleDownload} />
      )}

      {downloadedUri && (
        <Text style={styles.result}>
          Downloaded to: {downloadedUri}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  progress: {
    fontSize: 18,
    marginTop: 10,
  },
  result: {
    marginTop: 20,
    fontSize: 12,
    textAlign: 'center',
  },
});
