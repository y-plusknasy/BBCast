import { FlatList, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useEpisode } from '@/contexts/episode-context';
import { Collapsible } from '@/components/ui/collapsible';
import type { VocabularyItem } from '@bbcast/shared';

export default function VocabularyScreen() {
  const episode = useEpisode();
  const tintColor = useThemeColor({}, 'tint');

  if (!episode) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList<VocabularyItem>
        data={episode.vocabulary}
        keyExtractor={(item: VocabularyItem, index: number) => `${item.word}-${index}`}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: VocabularyItem }) => <VocabItem vocab={item} />}
        ListEmptyComponent={
          <View style={styles.center}>
            <ThemedText>語彙データがありません</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

function VocabItem({ vocab }: { vocab: VocabularyItem }) {
  return (
    <View style={styles.item}>
      <Collapsible title={vocab.word}>
        <ThemedText style={styles.definition}>{vocab.definition}</ThemedText>
      </Collapsible>
    </View>
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
    gap: 4,
  },
  item: {
    marginBottom: 4,
  },
  definition: {
    fontSize: 15,
    lineHeight: 22,
  },
});
