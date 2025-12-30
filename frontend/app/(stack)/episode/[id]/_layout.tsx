import { Stack } from 'expo-router';

export default function EpisodeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="vocabulary" options={{ title: 'Vocabulary' }} />
      <Stack.Screen name="transcript" options={{ title: 'Transcript' }} />
      <Stack.Screen name="quiz" options={{ title: 'Quiz' }} />
    </Stack>
  );
}
