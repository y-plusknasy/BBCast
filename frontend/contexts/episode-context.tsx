import React, { createContext, useContext } from 'react';
import type { EpisodeWithId } from '@/services/firestore';

const EpisodeContext = createContext<EpisodeWithId | null>(null);

export function EpisodeProvider({
  episode,
  children,
}: {
  episode: EpisodeWithId | null;
  children: React.ReactNode;
}) {
  return (
    <EpisodeContext.Provider value={episode}>
      {children}
    </EpisodeContext.Provider>
  );
}

export function useEpisode(): EpisodeWithId | null {
  return useContext(EpisodeContext);
}
