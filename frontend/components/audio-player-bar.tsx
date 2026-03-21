import { StyleSheet, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useAudio } from '@/contexts/audio-context';
import { IconSymbol } from '@/components/ui/icon-symbol';

export function AudioPlayerBar() {
  const { currentTrack, isPlaying, isLoading, pause, resume, stop } = useAudio();
  const bgColor = useThemeColor({ light: '#f5f5f5', dark: '#1c1c1c' }, 'background');
  const borderColor = useThemeColor({ light: '#e0e0e0', dark: '#333' }, 'icon');
  const tintColor = useThemeColor({}, 'tint');

  if (!currentTrack) return null;

  const handlePlayPause = async () => {
    if (isPlaying) {
      await pause();
    } else {
      await resume();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor, borderTopColor: borderColor }]}>
      <View style={styles.info}>
        <ThemedText numberOfLines={1} type="defaultSemiBold" style={styles.title}>
          {currentTrack.title}
        </ThemedText>
        <ThemedText numberOfLines={1} style={styles.artist}>
          {currentTrack.artist}
        </ThemedText>
      </View>
      <View style={styles.controls}>
        {isLoading ? (
          <ActivityIndicator size="small" color={tintColor} />
        ) : (
          <TouchableOpacity onPress={handlePlayPause} style={styles.button}>
            <IconSymbol
              name={isPlaying ? 'pause.fill' : 'play.fill'}
              size={22}
              color={tintColor}
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={stop} style={styles.button}>
          <IconSymbol name="xmark" size={18} color={tintColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  info: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 14,
  },
  artist: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  button: {
    padding: 8,
  },
});
