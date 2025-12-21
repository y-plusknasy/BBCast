export interface VocabularyItem {
  word: string;
  definition: string;
}

export interface ScriptLine {
  speaker: string;
  text: string;
}

export interface EpisodeDetail {
  title: string;
  description?: string;
  date?: string;
  url: string;
  mp3Url?: string;
  script: ScriptLine[];
  vocabulary: VocabularyItem[];
  quizUrl?: string;
}
