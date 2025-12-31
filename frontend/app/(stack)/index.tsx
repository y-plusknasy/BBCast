import { StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy, limit, getCountFromServer } from 'firebase/firestore';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../../firebaseConfig';
import { useThemeColor } from '@/hooks/use-theme-color';

type Program = {
  id: string;
  title: string;
  description?: string;
};

type EpisodePreview = {
  id: string;
  title: string;
  date: any;
};

const ProgramListItem = ({ item }: { item: Program }) => {
  const router = useRouter();
  const [latestEpisodes, setLatestEpisodes] = useState<EpisodePreview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEpisodesInfo = async () => {
      try {
        // Fetch latest 3 episodes
        const q = query(
          collection(db, 'episodes'),
          where('programId', '==', item.id),
          orderBy('date', 'desc'),
          limit(3)
        );
        
        // Fetch total count
        const countQuery = query(
          collection(db, 'episodes'),
          where('programId', '==', item.id)
        );

        const [episodesSnapshot, countSnapshot] = await Promise.all([
          getDocs(q),
          getCountFromServer(countQuery)
        ]);

        const episodes = episodesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as EpisodePreview[];

        setLatestEpisodes(episodes);
        setTotalCount(countSnapshot.data().count);
      } catch (error) {
        console.error(`Error fetching episodes for ${item.id}:`, error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisodesInfo();
  }, [item.id]);

  return (
    <TouchableOpacity onPress={() => router.push(`/program/${item.id}`)}>
      <ThemedView style={styles.itemContainer}>
        <ThemedText type="subtitle" style={styles.programTitle}>{item.title}</ThemedText>
        
        {loading ? (
          <ActivityIndicator size="small" style={{ alignSelf: 'flex-start', marginVertical: 8 }} />
        ) : (
          <View style={styles.episodesList}>
            {latestEpisodes.map((ep) => (
              <View key={ep.id} style={styles.episodeRow}>
                <ThemedText style={styles.episodeDate}>
                  {typeof ep.date === 'string' ? ep.date : (ep.date?.seconds ? new Date(ep.date.seconds * 1000).toLocaleDateString() : '')}
                </ThemedText>
                <ThemedText numberOfLines={1} style={styles.episodeTitle}>
                  {ep.title}
                </ThemedText>
              </View>
            ))}
            
            {totalCount > 3 && (
              <ThemedText style={styles.totalCount}>
                {totalCount} episodes available
              </ThemedText>
            )}
          </View>
        )}
      </ThemedView>
    </TouchableOpacity>
  );
};

export default function ProgramListScreen() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const iconColor = useThemeColor({}, 'text');

  useEffect(() => {
    const fetchPrograms = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'programs'));
        const programsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Program[];
        setPrograms(programsData);
      } catch (error) {
        console.error("Error fetching programs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrograms();
  }, []);

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={iconColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={programs}
        renderItem={({ item }) => <ProgramListItem item={item} />}
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
  programTitle: {
    marginBottom: 12,
  },
  episodesList: {
    gap: 8,
  },
  episodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  episodeDate: {
    fontSize: 12,
    opacity: 0.7,
    width: 80,
  },
  episodeTitle: {
    flex: 1,
    fontSize: 14,
  },
  totalCount: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'right',
  },
});
