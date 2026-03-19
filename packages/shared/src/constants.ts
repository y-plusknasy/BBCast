// 番組 ID 定数
export const PROGRAM_IDS = {
  SIX_MINUTE_ENGLISH: '6-minute-english',
  THE_ENGLISH_WE_SPEAK: 'the-english-we-speak',
  REAL_EASY_ENGLISH: 'real-easy-english',
} as const;

export type ProgramId = typeof PROGRAM_IDS[keyof typeof PROGRAM_IDS];

// BBC サイト設定
export const BBC_CONFIG = {
  BASE_URL: 'https://www.bbc.co.uk',
} as const;

// Firestore コレクション名
export const COLLECTIONS = {
  PROGRAMS: 'programs',
  EPISODES: 'episodes',
  USERS: 'users',
} as const;

// ページネーション
export const PAGINATION = {
  EPISODES_PER_PAGE: 20,
} as const;
