import { z } from 'zod';

// === 基本型 ===

export const ScriptLineSchema = z.object({
  speaker: z.string(),
  text: z.string(),
});

export const VocabularyItemSchema = z.object({
  word: z.string(),
  definition: z.string(),
});

export const QuizOptionSchema = z.object({
  label: z.string(),
  isCorrect: z.boolean(),
});

export const QuizQuestionSchema = z.object({
  question: z.string(),
  options: z.array(QuizOptionSchema),
  answerIndex: z.number().int().min(0),
});

// === Firestore ドキュメントスキーマ ===

// programs コレクション
export const ProgramSchema = z.object({
  title: z.string(),
  urlPath: z.string(),
  baseUrl: z.string().url(),
  updatedAt: z.any().optional(), // Firestore Timestamp
});

// episodes コレクション
export const EpisodeSchema = z.object({
  programId: z.string(),
  title: z.string(),
  date: z.string(), // ISO 形式 "YYYY-MM-DD"
  url: z.string().url(),
  mp3Url: z.string().url(),
  description: z.string().optional(),
  quizUrl: z.string().url().optional(),
  script: z.array(ScriptLineSchema),
  vocabulary: z.array(VocabularyItemSchema),
  quizContent: z.array(QuizQuestionSchema),
  updatedAt: z.any().optional(), // Firestore Timestamp
});

// === スクレイパー出力スキーマ ===

export const EpisodeSummarySchema = z.object({
  title: z.string(),
  url: z.string().url(),
  date: z.string().optional(),
  description: z.string().optional(),
});

// スクレイパーが出力する詳細データ（mp3Url は取得失敗の可能性あり）
export const EpisodeDetailSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  date: z.date().optional(),
  url: z.string().url(),
  mp3Url: z.string().url().optional(),
  script: z.array(ScriptLineSchema),
  vocabulary: z.array(VocabularyItemSchema),
  quizUrl: z.string().url().optional(),
  quizContent: z.array(QuizQuestionSchema).optional(),
});

// === 型エクスポート ===

export type ScriptLine = z.infer<typeof ScriptLineSchema>;
export type VocabularyItem = z.infer<typeof VocabularyItemSchema>;
export type QuizOption = z.infer<typeof QuizOptionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
export type Program = z.infer<typeof ProgramSchema>;
export type Episode = z.infer<typeof EpisodeSchema>;
export type EpisodeSummary = z.infer<typeof EpisodeSummarySchema>;
export type EpisodeDetail = z.infer<typeof EpisodeDetailSchema>;
