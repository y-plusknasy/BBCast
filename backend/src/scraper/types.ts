// 共有パッケージから型を re-export
export {
  type ScriptLine,
  type VocabularyItem,
  type QuizOption,
  type QuizQuestion,
  type EpisodeSummary,
  type EpisodeDetail,
} from '@bbcast/shared';

import { IndexPageScraper } from './IndexPageScraper';

export interface ProgramConfig {
  id: string;
  title: string;
  urlPath: string;
  scraperClass: new (baseUrl?: string) => IndexPageScraper;
}
