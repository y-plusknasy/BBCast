import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, signInAnonymously } from '../firebaseConfig';
import { AudioProvider } from '@/contexts/audio-context';
import { AudioPlayerBar } from '@/components/audio-player-bar';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const signIn = async () => {
      try {
        await signInAnonymously(auth);
        console.log('Signed in anonymously');
      } catch (error) {
        console.error('Error signing in anonymously:', error);
      } finally {
        setIsReady(true);
      }
    };

    signIn();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AudioProvider>
        <Stack>
          <Stack.Screen name="(stack)" options={{ headerShown: false }} />
        </Stack>
        <AudioPlayerBar />
        <StatusBar style="auto" />
      </AudioProvider>
    </ThemeProvider>
  );
}
