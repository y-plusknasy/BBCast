import React, { createContext, useContext, useState, useEffect } from 'react';
import TrackPlayer, { State, usePlaybackState, useProgress } from 'react-native-track-player';
import { setupPlayer } from '../services/SetupService';

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

export const AudioProvider = ({ children }: { children: React.ReactNode }) => {
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
        id: url, // URLをIDとして使用
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
