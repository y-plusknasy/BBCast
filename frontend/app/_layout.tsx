import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import TrackPlayer from 'react-native-track-player';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, signInAnonymously } from '../firebaseConfig';
import { AudioProvider } from '@/context/AudioContext';
import AudioPlayerBar from '@/components/AudioPlayerBar';
import CustomDrawerContent from '@/components/CustomDrawerContent';
import { PlaybackService } from '@/services/PlaybackService';

export const unstable_settings = {
  initialRouteName: '(stack)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    const signIn = async () => {
      try {
        await signInAnonymously(auth);
        console.log('Signed in anonymously');
      } catch (error) {
        console.error('Error signing in anonymously:', error);
      }
    };

    signIn();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AudioProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Drawer 
            drawerContent={(props) => <CustomDrawerContent {...props} />}
            screenOptions={{ headerShown: false }}
          >
            <Drawer.Screen
              name="(stack)"
              options={{
                drawerLabel: 'Home',
                title: 'BBC Learning English',
              }}
            />
          </Drawer>
          <AudioPlayerBar />
          <StatusBar style="auto" />
        </ThemeProvider>
      </AudioProvider>
    </GestureHandlerRootView>
  );
}
