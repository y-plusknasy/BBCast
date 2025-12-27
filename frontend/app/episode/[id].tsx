import { useLocalSearchParams, Stack } from 'expo-router';
import { StyleSheet, ScrollView, ActivityIndicator, Button, View, useColorScheme } from 'react-native';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Audio } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { useWindowDimensions } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db } from '../../firebaseConfig';
import { Colors } from '@/constants/theme';

type VocabularyItem = {
  word: string;
  definition: string;
};

type EpisodeDetail = {
  id: string;
  title: string;
  description: string;
  date: any;
  audioUrl: string;
  script: string;
  vocabulary: VocabularyItem[];
};

export default function EpisodeDetailScreen() {
  const { id } = useLocalSearchParams();
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState<Audio.Sound>();
  const [isPlaying, setIsPlaying] = useState(false);
  const { width } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const textColor = Colors[colorScheme ?? 'light'].text;

  useEffect(() => {
    const fetchEpisode = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'six_minute_english', id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEpisode({ id: docSnap.id, ...docSnap.data() } as EpisodeDetail);
        } else {
          console.log("No such document!");
        }
      } catch (error) {
        console.error("Error fetching episode:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEpisode();
  }, [id]);

  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading Sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  const playSound = async () => {
    if (!episode?.audioUrl) return;
    
    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    } else {
      console.log('Loading Sound');
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
           { uri: episode.audioUrl }
        );
        setSound(newSound);
        console.log('Playing Sound');
        await newSound.playAsync();
        setIsPlaying(true);
      } catch (error) {
        console.error("Error playing sound:", error);
        alert("Could not play audio");
      }
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" />
      </ThemedView>
    );
  }

  if (!episode) {
    return (
      <ThemedView style={styles.center}>
        <ThemedText>Episode not found.</ThemedText>
      </ThemedView>
    );
  }

  const tagsStyles = {
    body: { color: textColor },
    p: { marginBottom: 10 },
    strong: { fontWeight: 'bold' as const },
  };

  return (
    <>
      <Stack.Screen options={{ title: episode.title }} />
      <ThemedView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="title">{episode.title}</ThemedText>
          <ThemedText style={styles.date}>{new Date(episode.date.seconds * 1000).toLocaleDateString()}</ThemedText>
          
          <View style={styles.audioContainer}>
            <Button title={isPlaying ? "Pause Audio" : "Play Audio"} onPress={playSound} />
          </View>

          <ThemedText type="subtitle" style={styles.sectionTitle}>Description</ThemedText>
          <ThemedText>{episode.description}</ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>Vocabulary</ThemedText>
          {episode.vocabulary && episode.vocabulary.map((item, index) => (
            <View key={index} style={styles.vocabItem}>
              <ThemedText type="defaultSemiBold">{item.word}</ThemedText>
              <ThemedText>{item.definition}</ThemedText>
            </View>
          ))}

          <ThemedText type="subtitle" style={styles.sectionTitle}>Transcript</ThemedText>
          <RenderHtml
            contentWidth={width - 32}
            source={{ html: episode.script }}
            tagsStyles={tagsStyles}
          />
        </ScrollView>
      </ThemedView>
    </>
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  date: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 16,
  },
  audioContainer: {
    marginVertical: 20,
  },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
  },
  vocabItem: {
    marginBottom: 12,
  },
});
