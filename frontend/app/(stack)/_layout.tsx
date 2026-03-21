import { Stack } from 'expo-router';

export default function StackLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: 'BBCast' }}
      />
      <Stack.Screen
        name="program/[id]"
        options={{ title: 'エピソード一覧' }}
      />
      <Stack.Screen
        name="episode/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
