import { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { getPrograms, type ProgramWithId } from '@/services/firestore';

export default function ProgramListScreen() {
  const [programs, setPrograms] = useState<ProgramWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getPrograms();
      setPrograms(data);
    } catch (e) {
      console.error('番組取得エラー:', e);
      setError('番組の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  const tintColor = useThemeColor({}, 'tint');

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>{error}</ThemedText>
        <TouchableOpacity onPress={fetchPrograms} style={[styles.retryButton, { borderColor: tintColor }]}>
          <ThemedText style={{ color: tintColor }}>リトライ</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList<ProgramWithId>
        data={programs}
        keyExtractor={(item: ProgramWithId) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: ProgramWithId }) => (
          <ProgramCard
            program={item}
            onPress={() => router.push(`/(stack)/program/${item.id}`)}
          />
        )}
      />
    </ThemedView>
  );
}

function ProgramCard({ program, onPress }: { program: ProgramWithId; onPress: () => void }) {
  const cardBg = useThemeColor({}, 'background');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'icon');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.card, { backgroundColor: cardBg, borderColor }]}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <ThemedText type="subtitle" style={styles.cardTitle}>{program.title}</ThemedText>
        <ThemedText style={styles.cardMeta}>
          {program.urlPath}
        </ThemedText>
      </View>
      <ThemedText style={styles.chevron}>›</ThemedText>
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
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 13,
    opacity: 0.6,
  },
  chevron: {
    fontSize: 24,
    opacity: 0.4,
    marginLeft: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
});
