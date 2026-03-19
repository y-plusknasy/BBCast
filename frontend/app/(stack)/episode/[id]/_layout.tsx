import { Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { getEpisode, type EpisodeWithId } from '@/services/firestore';
import { EpisodeProvider } from '@/contexts/episode-context';

export default function EpisodeLayout() {
  const { id: episodeId } = useLocalSearchParams<{ id: string }>();
  const [episode, setEpisode] = useState<EpisodeWithId | null>(null);
  const navigation = useNavigation();

  useEffect(() => {
    if (!episodeId) return;
    getEpisode(episodeId).then((ep) => {
      setEpisode(ep);
    });
  }, [episodeId]);

  useEffect(() => {
    if (episode) {
      navigation.getParent()?.setOptions({ title: episode.title });
    }
  }, [episode, navigation]);

  return (
    <EpisodeProvider episode={episode}>
      <Stack>
        <Stack.Screen
          name="index"
          options={{ title: episode?.title ?? '読み込み中...' }}
        />
        <Stack.Screen
          name="transcript"
          options={{ title: 'スクリプト' }}
        />
        <Stack.Screen
          name="vocabulary"
          options={{ title: '語彙' }}
        />
        <Stack.Screen
          name="quiz"
          options={{ title: 'クイズ' }}
        />
      </Stack>
    </EpisodeProvider>
  );
}
