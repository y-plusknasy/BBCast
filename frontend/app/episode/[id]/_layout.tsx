import { Stack } from 'expo-router';
import { View } from 'react-native';
import AudioPlayerBar from '@/components/AudioPlayerBar';

export default function EpisodeLayout() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="vocabulary" />
          <Stack.Screen name="transcript" />
          <Stack.Screen name="quiz" />
        </Stack>
      </View>
      <AudioPlayerBar />
    </View>
  );
}
