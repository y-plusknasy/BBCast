import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';
import TrackPlayer from 'react-native-track-player';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, signInAnonymously } from '../firebaseConfig';
import { AudioProvider } from '@/contexts/audio-context';
import { AudioPlayerBar } from '@/components/audio-player-bar';
import { PlaybackService } from '@/services/playback-service';
import { setupPlayer } from '@/services/setup-service';

// バックグラウンド再生サービスの登録 (モジュールスコープで一度だけ)
TrackPlayer.registerPlaybackService(() => PlaybackService);

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        await signInAnonymously(auth);
        console.log('Signed in anonymously');
        await setupPlayer();
        console.log('TrackPlayer initialized');
      } catch (error) {
        console.error('初期化エラー:', error);
      } finally {
        setIsReady(true);
      }
    };

    init();
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
