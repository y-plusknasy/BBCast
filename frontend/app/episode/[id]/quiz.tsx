import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function QuizScreen() {
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Quiz' }} />
      <View style={styles.center}>
        <ThemedText type="title">Coming Soon</ThemedText>
        <ThemedText>Quiz feature is under development.</ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
});
