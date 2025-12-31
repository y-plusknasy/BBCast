import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAudio } from '@/context/AudioContext';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useState } from 'react';
import TrackPlayer, { RepeatMode } from 'react-native-track-player';

export default function AudioPlayerBar() {
  const { currentEpisodeTitle, isPlaying, isLoading, position, duration, pauseEpisode, resumeEpisode } = useAudio();
  const colorScheme = useColorScheme();
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off);

  // If no episode is selected, don't show the bar
  if (!currentEpisodeTitle) return null;

  const togglePlay = () => {
    if (isPlaying) {
      pauseEpisode();
    } else {
      resumeEpisode();
    }
  };

  const toggleLoop = async () => {
    let newMode = RepeatMode.Off;
    if (repeatMode === RepeatMode.Off) {
      newMode = RepeatMode.Track;
    } else {
      newMode = RepeatMode.Off;
    }
    
    await TrackPlayer.setRepeatMode(newMode);
    setRepeatMode(newMode);
  };

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <View style={[styles.container, { backgroundColor, borderTopColor: 'rgba(150,150,150,0.2)' }]}>
      <View style={styles.info}>
        <ThemedText style={styles.title} numberOfLines={1}>{currentEpisodeTitle}</ThemedText>
        <ThemedText style={styles.time}>
          {formatTime(position)} / {formatTime(duration)}
        </ThemedText>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleLoop} style={styles.controlButton}>
          <Ionicons 
            name={repeatMode === RepeatMode.Track ? "repeat" : "repeat-outline"} 
            size={24} 
            color={repeatMode === RepeatMode.Track ? tintColor : 'gray'} 
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.controlButton}>
          {isLoading ? (
            <ActivityIndicator color={tintColor} />
          ) : (
            <Ionicons 
              name={isPlaying ? "pause" : "play"} 
              size={32} 
              color={tintColor} 
            />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatTime(seconds: number) {
  if (!seconds && seconds !== 0) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    height: 80,
  },
  info: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  time: {
    fontSize: 12,
    opacity: 0.7,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  controlButton: {
    padding: 8,
  },
});
