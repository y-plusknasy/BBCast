import { StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs, where, startAfter, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db, auth } from '../../../firebaseConfig';

type Episode = {
  id: string;
  title: string;
  description: string;
  date: any; // Timestamp
};

export default function EpisodeListScreen() {
  const { id: programId } = useLocalSearchParams();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!programId) return;
      
      setLoading(true);
      try {
        const q = query(
          collection(db, 'episodes'),
          where('programId', '==', programId),
          orderBy('date', 'desc'),
          limit(20)
        );
        const querySnapshot = await getDocs(q);
        const fetchedEpisodes: Episode[] = [];
        querySnapshot.forEach((doc) => {
          fetchedEpisodes.push({ id: doc.id, ...doc.data() } as Episode);
        });
        setEpisodes(fetchedEpisodes);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1] || null);
        setHasMore(querySnapshot.docs.length === 20);
      } catch (error) {
        console.error("Error fetching episodes: ", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchEpisodes();
      }
    });

    return () => unsubscribe();
  }, [programId]);

  const loadMoreEpisodes = async () => {
    if (!hasMore || isFetchingMore || !lastVisible) return;

    setIsFetchingMore(true);
    try {
      const q = query(
        collection(db, 'episodes'),
        where('programId', '==', programId),
        orderBy('date', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const newEpisodes: Episode[] = [];
        querySnapshot.forEach((doc) => {
          newEpisodes.push({ id: doc.id, ...doc.data() } as Episode);
        });
        setEpisodes(prev => [...prev, ...newEpisodes]);
        setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
        if (querySnapshot.docs.length < 20) setHasMore(false);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Error fetching more episodes: ", error);
    } finally {
      setIsFetchingMore(false);
    }
  };

  const renderFooter = () => {
    if (!isFetchingMore) return null;
    return (
      <View style={{ paddingVertical: 20 }}>
        <ActivityIndicator size="small" />
      </View>
    );
  };

  const renderItem = ({ item }: { item: Episode }) => (
    <TouchableOpacity onPress={() => router.push(`/episode/${item.id}`)}>
      <ThemedView style={styles.itemContainer}>
        <ThemedText type="subtitle" style={styles.title}>{item.title}</ThemedText>
        <ThemedText style={styles.date}>
          {typeof item.date === 'string' ? item.date : (item.date?.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString() : '')}
        </ThemedText>
        <View style={styles.divider} />
        <ThemedText style={styles.description} numberOfLines={3}>{item.description}</ThemedText>
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
        onEndReached={loadMoreEpisodes}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
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
  },
  itemContainer: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  title: {
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
});
