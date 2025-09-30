import * as React from 'react';

import { StyleSheet, View, Text, Button, ActivityIndicator } from 'react-native';
import { useDownload } from 'expodl';

export default function App() {
  const { download, isDownloading, progress, error, result, reset } = useDownload();

  const handleDownload = () => {
    download('https://i.imgur.com/CzXTtJV.jpg');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>expodl Example</Text>
      <Text style={styles.subtitle}>Simple download with hook</Text>

      {isDownloading ? (
        <View style={styles.downloadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.progress}>
            {Math.round(progress * 100)}%
          </Text>
        </View>
      ) : (
        <Button title="Download Image" onPress={handleDownload} />
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error.message}</Text>
          <Button title="Try Again" onPress={reset} />
        </View>
      )}

      {result && !isDownloading && !error && (
        <View style={styles.resultContainer}>
          <Text style={styles.successText}>✓ Download complete!</Text>
          <Text style={styles.resultText}>File: {result.fileName}</Text>
          <Text style={styles.resultText}>Type: {result.mimeType}</Text>
        </View>
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
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  downloadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  progress: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    color: '#007AFF',
  },
  errorContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 12,
    textAlign: 'center',
  },
  resultContainer: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 12,
    color: '#555',
    marginTop: 4,
  },
});
