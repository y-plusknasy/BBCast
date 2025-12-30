import * as dotenv from 'dotenv';
import { ProgramConfig } from './scraper/types';
import { SixMinuteEnglishScraper } from './scraper/SixMinuteEnglishScraper';
import { TheEnglishWeSpeakScraper } from './scraper/TheEnglishWeSpeakScraper';
import { RealEasyEnglishScraper } from './scraper/RealEasyEnglishScraper';

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
    {
      id: 'the-english-we-speak',
      title: 'The English We Speak',
      urlPath: '/learningenglish/features/the-english-we-speak',
      scraperClass: TheEnglishWeSpeakScraper,
    },
    {
      id: 'real-easy-english',
      title: 'Real Easy English',
      urlPath: '/learningenglish/english/features/real-easy-english',
      scraperClass: RealEasyEnglishScraper,
    },
  ] as ProgramConfig[],
};
