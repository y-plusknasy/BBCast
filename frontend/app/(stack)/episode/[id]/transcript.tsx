import { StyleSheet, ScrollView, ActivityIndicator, useWindowDimensions, useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import RenderHtml from 'react-native-render-html';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../../../../firebaseConfig';
import { Colors } from '@/constants/theme';

export default function TranscriptScreen() {
  const { id } = useLocalSearchParams();
  const [script, setScript] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const textColor = Colors[colorScheme ?? 'light'].text;

  useEffect(() => {
    const fetchScript = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'episodes', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setScript(data.script || '');
        }
      } catch (error) {
        console.error("Error fetching script:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchScript();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  const tagsStyles = {
    body: { color: textColor, fontSize: 16, lineHeight: 24 },
    p: { marginBottom: 16 },
    strong: { fontWeight: 'bold' as const, color: '#a1cedc' },
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Transcript' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {script ? (
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: script }}
            tagsStyles={tagsStyles}
          />
        ) : (
          <ThemedText>No transcript available for this episode.</ThemedText>
        )}
      </ScrollView>
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
  },
  content: {
    padding: 16,
  },
});
