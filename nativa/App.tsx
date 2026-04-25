import { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const CONFIG_FILE = 'https://raw.githubusercontent.com/alandelleore/farmacias-config/main/config.json';
const DEFAULT_URL = 'https://farmaciascarca-tau.vercel.app';

interface Config {
  url: string;
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [webviewUrl, setWebviewUrl] = useState(DEFAULT_URL);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch(CONFIG_FILE);
      if (response.ok) {
        const config: Config = await response.json();
        if (config.url) {
          setWebviewUrl(config.url);
        }
      }
    } catch {
      console.log('Usando URL por defecto:', DEFAULT_URL);
    } finally {
      setIsLoading(false);
      await SplashScreen.hideAsync();
    }
  };

  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>FC</Text>
        </View>
        <ActivityIndicator size="large" color="white" style={styles.loader} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: webviewUrl }}
        style={styles.webview}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={(syntheticEvent) => {
          setError(syntheticEvent.nativeEvent.description);
        }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#667eea" />
          </View>
        )}
      />
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error al cargar la página</Text>
          <Text style={styles.errorUrl}>{webviewUrl}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
  splashContainer: {
    flex: 1,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#764ba2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 30,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  errorUrl: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    textAlign: 'center',
  },
});