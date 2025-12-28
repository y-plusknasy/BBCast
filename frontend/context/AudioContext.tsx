import React, { createContext, useContext, useState } from 'react';
import { useAudioPlayer, AudioPlayer } from 'expo-audio';

type AudioContextType = {
  player: AudioPlayer;
  playEpisode: (url: string, title: string) => void;
  currentEpisodeTitle: string | null;
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
  // Initialize with a dummy source or null if supported (types say source is optional)
  // We'll use null initially.
  const player = useAudioPlayer(null);
  const [currentEpisodeTitle, setCurrentEpisodeTitle] = useState<string | null>(null);

  const playEpisode = (url: string, title: string) => {
    setCurrentEpisodeTitle(title);
    player.replace(url);
    player.play();
  };

  return (
    <AudioContext.Provider value={{ player, playEpisode, currentEpisodeTitle }}>
      {children}
    </AudioContext.Provider>
  );
};
