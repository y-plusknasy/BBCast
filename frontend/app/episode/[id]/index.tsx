import { StyleSheet, ActivityIndicator, TouchableOpacity, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { db, auth } from '../../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useAudio } from '@/context/AudioContext';

type EpisodeDetail = {
  id: string;
  title: string;
  description: string;
  date: any;
  audioUrl: string;
};

export default function EpisodeTopicListScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [episode, setEpisode] = useState<EpisodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { playEpisode } = useAudio();

  useEffect(() => {
    const fetchEpisode = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'episodes', id as string);
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

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchEpisode();
      }
    });

    return () => unsubscribe();
  }, [id]);

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

  const MenuButton = ({ title, icon, route, onPress }: { title: string, icon: keyof typeof Ionicons.glyphMap, route?: string, onPress?: () => void }) => (
    <TouchableOpacity 
      style={styles.button} 
      onPress={() => {
        if (onPress) onPress();
        else if (route) router.push(route as any);
        else alert('Coming soon');
      }}
    >
      <Ionicons name={icon} size={24} color="white" style={styles.icon} />
      <ThemedText type="defaultSemiBold">{title}</ThemedText>
      <Ionicons name="chevron-forward" size={24} color="gray" style={styles.chevron} />
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Episode Topics' }} />
      
      <View style={styles.header}>
        <ThemedText type="title">{episode.title}</ThemedText>
        <ThemedText style={styles.date}>
          {episode.date?.seconds ? new Date(episode.date.seconds * 1000).toLocaleDateString() : ''}
        </ThemedText>
      </View>

      <View style={styles.menu}>
        <MenuButton 
          title="Play Audio" 
          icon="play-circle-outline" 
          onPress={() => episode && playEpisode(episode.audioUrl, episode.title)} 
        />
        <MenuButton title="Vocabulary" icon="book-outline" route={`/episode/${id}/vocabulary`} />
        <MenuButton title="Transcript" icon="document-text-outline" route={`/episode/${id}/transcript`} />
        <MenuButton title="Quiz" icon="help-circle-outline" route={`/episode/${id}/quiz`} />
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 32,
  },
  date: {
    marginTop: 8,
    opacity: 0.7,
  },
  menu: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
    borderRadius: 12,
  },
  icon: {
    marginRight: 16,
  },
  chevron: {
    marginLeft: 'auto',
  },
});
