import * as React from 'react';

import {
  StyleSheet,
  View,
  Text,
  Button,
  ActivityIndicator,
} from 'react-native';
import { useDownload } from 'expodl';

export default function App() {
  const { download, cancel, isDownloading, progress, error, result, reset } =
    useDownload();

  const handleDownload = () => {
    download('https://i.imgur.com/CzXTtJV.jpg');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>expodl Example</Text>
      <Text style={styles.subtitle}>Download with cancellation</Text>

      {!isDownloading && !result && (
        <Button title="Download Image" onPress={handleDownload} />
      )}

      {isDownloading && (
        <View style={styles.downloadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.progress}>{Math.round(progress * 100)}%</Text>
          <View style={styles.buttonContainer}>
            <Button title="Cancel" onPress={cancel} color="#ff3b30" />
          </View>
        </View>
      )}

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error.code === 'CANCELLED'
              ? '❌ Download cancelled'
              : `Error: ${error.message}`}
          </Text>
          <Button title="Try Again" onPress={reset} />
        </View>
      )}

      {result && !isDownloading && !error && (
        <View style={styles.resultContainer}>
          <Text style={styles.successText}>✓ Download complete!</Text>
          <Text style={styles.resultText}>File: {result.fileName}</Text>
          <Text style={styles.resultText}>Type: {result.mimeType}</Text>
          {result.cached && (
            <Text style={styles.cachedText}>📦 Loaded from cache</Text>
          )}
          <View style={styles.buttonContainer}>
            <Button title="Download Another" onPress={reset} />
          </View>
        </View>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Features: Cancellation • Progress • Error Handling
        </Text>
      </View>
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
    marginBottom: 16,
    color: '#007AFF',
  },
  buttonContainer: {
    marginTop: 12,
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
    fontSize: 16,
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
  cachedText: {
    fontSize: 12,
    color: '#1976d2',
    marginTop: 8,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});
