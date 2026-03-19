import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Audio } from 'expo-av';

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
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const cleanup = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch {
        // 既にアンロード済みの場合は無視
      }
      soundRef.current = null;
    }
  }, []);

  const playTrack = useCallback(async (track: Track) => {
    setIsLoading(true);
    try {
      await cleanup();

      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: track.url },
        { shouldPlay: true },
        (status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
            }
          }
        },
      );

      soundRef.current = sound;
      setCurrentTrack(track);
      setIsPlaying(true);
    } catch (error) {
      console.error('音声再生エラー:', error);
    } finally {
      setIsLoading(false);
    }
  }, [cleanup]);

  const pause = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(async () => {
    if (soundRef.current) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  }, []);

  const stop = useCallback(async () => {
    await cleanup();
    setCurrentTrack(null);
    setIsPlaying(false);
  }, [cleanup]);

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
