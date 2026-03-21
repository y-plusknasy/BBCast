import React, { createContext, useContext, useCallback } from 'react';
import TrackPlayer, { usePlaybackState, useActiveTrack, State } from 'react-native-track-player';

// 音声トラック情報
export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string; // 番組名
}

interface AudioContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  playTrack: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const playbackState = usePlaybackState();
  const activeTrack = useActiveTrack();

  const isPlaying = playbackState.state === State.Playing;
  const isLoading =
    playbackState.state === State.Loading ||
    playbackState.state === State.Buffering;

  const currentTrack: Track | null = activeTrack
    ? {
        id: String(activeTrack.id ?? ''),
        url: activeTrack.url,
        title: activeTrack.title ?? '',
        artist: activeTrack.artist ?? '',
      }
    : null;

  const playTrack = useCallback(async (track: Track) => {
    await TrackPlayer.reset();
    await TrackPlayer.add({
      id: track.id,
      url: track.url,
      title: track.title,
      artist: track.artist,
    });
    await TrackPlayer.play();
  }, []);

  const pause = useCallback(async () => {
    await TrackPlayer.pause();
  }, []);

  const resume = useCallback(async () => {
    await TrackPlayer.play();
  }, []);

  const stop = useCallback(async () => {
    await TrackPlayer.reset();
  }, []);

  return (
    <AudioContext.Provider value={{ currentTrack, isPlaying, isLoading, playTrack, pause, resume, stop }}>
      {children}
    </AudioContext.Provider>
  );
}

export function useAudio(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio は AudioProvider 内で使用する必要があります');
  }
  return context;
}
