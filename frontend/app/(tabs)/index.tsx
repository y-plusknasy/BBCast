import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../../firebaseConfig';

type Episode = {
  id: string;
  title: string;
  description: string;
  date: any; // Timestamp
};

export default function HomeScreen() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEpisodes = async () => {
      try {
        const q = query(
          collection(db, 'six_minute_english'),
          orderBy('date', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const fetchedEpisodes: Episode[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEpisodes.push({ id: doc.id, ...doc.data() } as Episode);
        });
        setEpisodes(fetchedEpisodes);
      } catch (error) {
        console.error("Error fetching episodes: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodes();
  }, []);

  const renderItem = ({ item }: { item: Episode }) => (
    <TouchableOpacity onPress={() => router.push(`/episode/${item.id}` as any)}>
      <ThemedView style={styles.itemContainer}>
        <ThemedText type="subtitle">{item.title}</ThemedText>
        <ThemedText numberOfLines={2}>{item.description}</ThemedText>
        <ThemedText style={styles.date}>{new Date(item.date.seconds * 1000).toLocaleDateString()}</ThemedText>
      </ThemedView>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={episodes}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
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
  listContent: {
    padding: 16,
    paddingTop: 60, // Add padding for status bar
  },
  itemContainer: {
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(150, 150, 150, 0.1)', // Slight background for items
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});
