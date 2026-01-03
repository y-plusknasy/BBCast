import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';

type AudioContextType = {
  playEpisode: (url: string, title: string, artist?: string, artwork?: string) => Promise<void>;
  pauseEpisode: () => Promise<void>;
  resumeEpisode: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  currentEpisodeTitle: string | null;
  isPlaying: boolean;
  isLoading: boolean;
  position: number;
  duration: number;
};

const AudioContext = createContext<AudioContextType | null>(null);

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};

// Web プラットフォーム用のダミー実装
const WebAudioProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentEpisodeTitle] = useState<string | null>(null);

  const playEpisode = async () => {
    console.log('[Web] Audio playback not supported');
  };

  const pauseEpisode = async () => {};
  const resumeEpisode = async () => {};
  const seekTo = async () => {};

  return (
    <AudioContext.Provider value={{ 
      playEpisode, 
      pauseEpisode, 
      resumeEpisode, 
      seekTo,
      currentEpisodeTitle, 
      isPlaying: false,
      isLoading: false,
      position: 0,
      duration: 0
    }}>
      {children}
    </AudioContext.Provider>
  );
};

// ネイティブプラットフォーム用の実装
const NativeAudioProvider = ({ children }: { children: React.ReactNode }) => {
  // dynamic import でエラーを回避
  const TrackPlayer = require('react-native-track-player').default;
  const { State, usePlaybackState, useProgress } = require('react-native-track-player');
  const { setupPlayer } = require('../services/SetupService');

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [currentEpisodeTitle, setCurrentEpisodeTitle] = useState<string | null>(null);
  
  const playbackState = usePlaybackState();
  const progress = useProgress();

  useEffect(() => {
    const setup = async () => {
      const isSetup = await setupPlayer();
      setIsPlayerReady(isSetup);
    };
    setup();
  }, []);

  const playEpisode = async (url: string, title: string, artist: string = 'BBC Learning English', artwork?: string) => {
    if (!isPlayerReady) return;

    try {
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: url,
        url: url,
        title: title,
        artist: artist,
        artwork: artwork,
      });
      setCurrentEpisodeTitle(title);
      await TrackPlayer.play();
    } catch (error) {
      console.error('Error playing episode:', error);
    }
  };

  const pauseEpisode = async () => {
    await TrackPlayer.pause();
  };

  const resumeEpisode = async () => {
    await TrackPlayer.play();
  };

  const seekTo = async (position: number) => {
    await TrackPlayer.seekTo(position);
  };

  const isPlaying = playbackState.state === State.Playing;
  const isLoading = playbackState.state === State.Buffering || playbackState.state === State.Loading;

  return (
    <AudioContext.Provider value={{ 
      playEpisode, 
      pauseEpisode, 
      resumeEpisode, 
      seekTo,
      currentEpisodeTitle, 
      isPlaying,
      isLoading,
      position: progress.position,
      duration: progress.duration
    }}>
      {children}
    </AudioContext.Provider>
  );
};

// プラットフォームに応じて適切な Provider を export
export const AudioProvider = Platform.OS === 'web' ? WebAudioProvider : NativeAudioProvider;
