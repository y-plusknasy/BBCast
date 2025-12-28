import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { auth, signInAnonymously } from '../firebaseConfig';
import { AudioProvider } from '@/context/AudioContext';

export const unstable_settings = {
  initialRouteName: 'index',
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
          <Drawer>
            <Drawer.Screen
              name="index"
              options={{
                drawerLabel: 'Programs',
                title: 'BBC Learning English',
              }}
            />
            <Drawer.Screen
              name="program/[id]"
              options={{
                drawerItemStyle: { display: 'none' }, // Hide from drawer menu
                title: 'Episodes',
              }}
            />
            <Drawer.Screen
              name="episode/[id]"
              options={{
                drawerItemStyle: { display: 'none' }, // Hide from drawer menu
                headerShown: false, // Episode details will manage their own header or use stack
              }}
            />
            <Drawer.Screen
              name="modal"
              options={{
                drawerItemStyle: { display: 'none' },
                title: 'Modal'
              }}
            />
          </Drawer>
          <StatusBar style="auto" />
        </ThemeProvider>
      </AudioProvider>
    </GestureHandlerRootView>
  );
}
