import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAudioPlayerStatus } from 'expo-audio';
import { useAudio } from '@/context/AudioContext';
import { ThemedText } from './themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useState, useEffect } from 'react';

export default function AudioPlayerBar() {
  const { player, currentEpisodeTitle } = useAudio();
  const colorScheme = useColorScheme();
  const status = useAudioPlayerStatus(player);
  const [isLooping, setIsLooping] = useState(player.loop);

  // Sync local loop state with player loop state if it changes externally
  useEffect(() => {
    setIsLooping(player.loop);
  }, [player.loop]);
  
  // If no episode is selected, don't show the bar
  if (!currentEpisodeTitle) return null;

  const togglePlay = () => {
    if (player.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const toggleLoop = () => {
    const newLoopState = !player.loop;
    player.loop = newLoopState;
    setIsLooping(newLoopState);
  };

  const backgroundColor = Colors[colorScheme ?? 'light'].background;
  const tintColor = Colors[colorScheme ?? 'light'].tint;

  return (
    <View style={[styles.container, { backgroundColor, borderTopColor: 'rgba(150,150,150,0.2)' }]}>
      <View style={styles.info}>
        <ThemedText style={styles.title} numberOfLines={1}>{currentEpisodeTitle}</ThemedText>
        <ThemedText style={styles.time}>
          {formatTime(status.currentTime)} / {formatTime(status.duration)}
        </ThemedText>
      </View>
      
      <View style={styles.controls}>
        <TouchableOpacity onPress={toggleLoop} style={styles.controlButton}>
          <Ionicons 
            name={isLooping ? "repeat" : "repeat-outline"} 
            size={24} 
            color={isLooping ? tintColor : 'gray'} 
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={togglePlay} style={styles.controlButton}>
          {status.isBuffering ? (
            <ActivityIndicator color={tintColor} />
          ) : (
            <Ionicons 
              name={player.playing ? "pause" : "play"} 
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
