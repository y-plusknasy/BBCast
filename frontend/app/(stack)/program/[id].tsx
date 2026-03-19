import { useEffect, useState, useCallback, useRef } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getEpisodes, getProgram, type EpisodeWithId } from '@/services/firestore';

export default function EpisodeListScreen() {
  const { id: programId } = useLocalSearchParams<{ id: string }>();
  const [episodes, setEpisodes] = useState<EpisodeWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastDocRef = useRef<QueryDocumentSnapshot<DocumentData> | null>(null);
  const router = useRouter();
  const navigation = useNavigation();

  // ヘッダータイトルを番組名に設定
  useEffect(() => {
    if (!programId) return;
    getProgram(programId).then((program) => {
      if (program) {
        navigation.setOptions({ title: program.title });
      }
    });
  }, [programId, navigation]);

  const fetchEpisodes = useCallback(async () => {
    if (!programId) return;
    try {
      setLoading(true);
      const result = await getEpisodes(programId);
      setEpisodes(result.episodes);
      lastDocRef.current = result.lastDoc;
      setHasMore(result.episodes.length >= 20);
    } catch (e) {
      console.error('エピソード取得エラー:', e);
    } finally {
      setLoading(false);
    }
  }, [programId]);

  const loadMore = useCallback(async () => {
    if (!programId || loadingMore || !hasMore || !lastDocRef.current) return;
    try {
      setLoadingMore(true);
      const result = await getEpisodes(programId, 20, lastDocRef.current);
      setEpisodes((prev) => [...prev, ...result.episodes]);
      lastDocRef.current = result.lastDoc;
      setHasMore(result.episodes.length >= 20);
    } catch (e) {
      console.error('追加読み込みエラー:', e);
    } finally {
      setLoadingMore(false);
    }
  }, [programId, loadingMore, hasMore]);

  useEffect(() => {
    fetchEpisodes();
  }, [fetchEpisodes]);

  const tintColor = useThemeColor({}, 'tint');

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList<EpisodeWithId>
        data={episodes}
        keyExtractor={(item: EpisodeWithId) => item.id}
        contentContainerStyle={styles.list}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }: { item: EpisodeWithId }) => (
          <EpisodeCard
            episode={item}
            onPress={() => router.push(`/(stack)/episode/${item.id}`)}
          />
        )}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={styles.footer} color={tintColor} />
          ) : null
        }
        ListEmptyComponent={
          <ThemedView style={styles.center}>
            <ThemedText>エピソードがありません</ThemedText>
          </ThemedView>
        }
      />
    </ThemedView>
  );
}

function EpisodeCard({ episode, onPress }: { episode: EpisodeWithId; onPress: () => void }) {
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'icon');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { borderColor }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <ThemedText style={styles.date}>{episode.date}</ThemedText>
      </View>
      <ThemedText type="defaultSemiBold" numberOfLines={2}>{episode.title}</ThemedText>
      {episode.description ? (
        <ThemedText style={styles.description} numberOfLines={2}>
          {episode.description}
        </ThemedText>
      ) : null}
    </TouchableOpacity>
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
    padding: 20,
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  date: {
    fontSize: 13,
    opacity: 0.6,
  },
  description: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  footer: {
    paddingVertical: 20,
  },
});
