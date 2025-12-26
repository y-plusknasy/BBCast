import * as dotenv from 'dotenv';
import { ProgramConfig } from './scraper/types';
import { SixMinuteEnglishScraper } from './scraper/SixMinuteEnglishScraper';

dotenv.config();

export const config = {
  bbc: {
    baseUrl: process.env.BBC_BASE_URL || 'https://www.bbc.co.uk',
  },
  programs: [
    {
      id: '6-minute-english',
      title: '6 Minute English',
      urlPath: '/learningenglish/english/features/6-minute-english',
      scraperClass: SixMinuteEnglishScraper,
    },
  ] as ProgramConfig[],
};
