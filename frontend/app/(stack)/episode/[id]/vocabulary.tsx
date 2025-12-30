import { StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../../../../firebaseConfig';

type VocabularyItem = {
  word: string;
  definition: string;
};

export default function VocabularyScreen() {
  const { id } = useLocalSearchParams();
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVocabulary = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'episodes', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setVocabulary(data.vocabulary || []);
        }
      } catch (error) {
        console.error("Error fetching vocabulary:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchVocabulary();
  }, [id]);

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Vocabulary' }} />
      <ScrollView contentContainerStyle={styles.content}>
        {vocabulary.map((item, index) => (
          <ThemedView key={index} style={styles.item}>
            <ThemedText type="defaultSemiBold" style={styles.word}>{item.word}</ThemedText>
            <ThemedText>{item.definition}</ThemedText>
          </ThemedView>
        ))}
        {vocabulary.length === 0 && (
          <ThemedText>No vocabulary available for this episode.</ThemedText>
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
  item: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 8,
  },
  word: {
    marginBottom: 8,
    fontSize: 18,
    color: '#a1cedc',
  },
});
