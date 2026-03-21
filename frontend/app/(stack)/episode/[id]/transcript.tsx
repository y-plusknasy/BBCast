import { FlatList, StyleSheet, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useEpisode } from '@/contexts/episode-context';
import type { ScriptLine } from '@bbcast/shared';

export default function TranscriptScreen() {
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
      <FlatList<ScriptLine>
        data={episode.script}
        keyExtractor={(_: ScriptLine, index: number) => index.toString()}
        contentContainerStyle={styles.list}
        renderItem={({ item }: { item: ScriptLine }) => <ScriptLineItem line={item} />}
      />
    </ThemedView>
  );
}

function ScriptLineItem({ line }: { line: ScriptLine }) {
  const speakerColor = useThemeColor({}, 'tint');
  const borderColor = useThemeColor({ light: '#f0f0f0', dark: '#2a2a2a' }, 'icon');

  return (
    <View style={[styles.lineContainer, { borderBottomColor: borderColor }]}>
      {line.speaker ? (
        <ThemedText style={[styles.speaker, { color: speakerColor }]}>
          {line.speaker}
        </ThemedText>
      ) : null}
      <ThemedText style={styles.text}>{line.text}</ThemedText>
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
  },
  list: {
    padding: 16,
  },
  lineContainer: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  speaker: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 24,
  },
});
