import { StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useEpisode } from '@/contexts/episode-context';
import { useAudio, type Track } from '@/contexts/audio-context';
import { IconSymbol, type IconSymbolName } from '@/components/ui/icon-symbol';

export default function EpisodeDetailScreen() {
  const episode = useEpisode();
  const router = useRouter();
  const { id: episodeId } = useLocalSearchParams<{ id: string }>();
  const { playTrack, isPlaying, currentTrack, pause, resume, isLoading } = useAudio();
  const tintColor = useThemeColor({}, 'tint');

  if (!episode) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  const isCurrentTrack = currentTrack?.id === episode.id;

  const handlePlay = async () => {
    if (isCurrentTrack && isPlaying) {
      await pause();
    } else if (isCurrentTrack && !isPlaying) {
      await resume();
    } else {
      const track: Track = {
        id: episode.id,
        url: episode.mp3Url,
        title: episode.title,
        artist: episode.programId,
      };
      await playTrack(track);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ThemedView style={styles.container}>
        {/* エピソード情報 */}
        <ThemedText style={styles.date}>{episode.date}</ThemedText>
        {episode.description ? (
          <ThemedText style={styles.description}>{episode.description}</ThemedText>
        ) : null}

        {/* 再生ボタン */}
        <TouchableOpacity
          onPress={handlePlay}
          disabled={isLoading}
          style={[styles.playButton, { backgroundColor: tintColor }]}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol
                name={isCurrentTrack && isPlaying ? 'pause.fill' : 'play.fill'}
                size={20}
                color="#fff"
              />
              <ThemedText style={styles.playButtonText}>
                {isCurrentTrack && isPlaying ? '一時停止' : '再生'}
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* メニュー */}
        <View style={styles.menuSection}>
          {episode.script.length > 0 && (
            <MenuItem
              title="スクリプト"
              subtitle={`${episode.script.length} 行`}
              icon="doc.text"
              onPress={() => router.push(`/(stack)/episode/${episodeId}/transcript`)}
            />
          )}

          {episode.vocabulary.length > 0 && (
            <MenuItem
              title="語彙"
              subtitle={`${episode.vocabulary.length} 語`}
              icon="book"
              onPress={() => router.push(`/(stack)/episode/${episodeId}/vocabulary`)}
            />
          )}

          {episode.quizContent.length > 0 && (
            <MenuItem
              title="クイズ"
              subtitle={`${episode.quizContent.length} 問`}
              icon="questionmark.circle"
              onPress={() => router.push(`/(stack)/episode/${episodeId}/quiz`)}
            />
          )}
        </View>
      </ThemedView>
    </ScrollView>
  );
}

function MenuItem({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: IconSymbolName;
  onPress: () => void;
}) {
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'icon');
  const iconColor = useThemeColor({}, 'tint');

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuItem, { borderColor }]}
      activeOpacity={0.7}
    >
      <IconSymbol name={icon} size={24} color={iconColor} />
      <View style={styles.menuContent}>
        <ThemedText type="defaultSemiBold">{title}</ThemedText>
        <ThemedText style={styles.menuSubtitle}>{subtitle}</ThemedText>
      </View>
      <ThemedText style={styles.chevron}>›</ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
  },
  date: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 28,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  menuSection: {
    gap: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    gap: 14,
  },
  menuContent: {
    flex: 1,
  },
  menuSubtitle: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    opacity: 0.4,
  },
});
