import { IndexPageScraper } from './IndexPageScraper';

export interface ProgramConfig {
  id: string;
  title: string;
  urlPath: string;
  scraperClass: new (baseUrl?: string) => IndexPageScraper;
}

export interface EpisodeSummary {
  title: string;
  url: string;
  date?: string;
  description?: string;
}

export interface VocabularyItem {
  word: string;
  definition: string;
}

export interface ScriptLine {
  speaker: string;
  text: string;
}

export interface QuizOption {
  label: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  question: string;
  options: QuizOption[];
  answerIndex: number;
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
  quizContent?: QuizQuestion[];
}
