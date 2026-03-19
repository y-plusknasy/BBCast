# バックエンド詳細設計 v2

> **最終更新**: 2026-03-19  
> **対象フェーズ**: Phase 0 (設計・基盤整備)

---

## 1. 概要

Cloud Functions v2 によるスクレイピングシステム。BBC Learning English の 3 番組を自動収集し、Firestore に保存する。

---

## 2. 技術スタック

| 項目 | 技術 | バージョン |
|------|------|------------|
| ランタイム | Node.js | 22 |
| 言語 | TypeScript | 5.9.x |
| フレームワーク | Cloud Functions v2 | firebase-functions 7.x |
| HTTP クライアント | axios | 1.13.x |
| HTML パーサー | cheerio | 1.1.x |
| DB クライアント | firebase-admin | 13.x |
| 環境変数 | dotenv | 17.x |
| リージョン | asia-northeast1 (東京) | — |

---

## 3. ディレクトリ構成

```
backend/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                    # Cloud Functions エントリーポイント
    ├── config.ts                   # 番組設定・環境変数
    ├── scrape.ts                   # スタンドアロン実行スクリプト
    ├── import-data.ts              # レガシー: データインポートスクリプト (要修正)
    ├── database/
    │   └── repository.ts           # Firestore 書き込み
    └── scraper/
        ├── types.ts                # 型定義 (インターフェース)
        ├── BaseScraper.ts          # 基底クラス (HTTP + パース)
        ├── IndexPageScraper.ts     # 目次ページ解析の基底クラス
        ├── SixMinuteEnglishScraper.ts      # 6 Minute English
        ├── SixMinuteEnglishQuizScraper.ts  # クイズ解析 (Riddle.com)
        ├── TheEnglishWeSpeakScraper.ts     # The English We Speak
        └── RealEasyEnglishScraper.ts       # Real Easy English
```

---

## 4. スクレイパークラス階層

```
BaseScraper (abstract)
├── axiosInstance (timeout: 10s, UA: BBCast/1.0)
├── fetchHtml(url) → string
├── parseHtml(html) → CheerioAPI
├── fetchAndParse(url) → CheerioAPI
└── cleanText(text) → string

    └── IndexPageScraper (abstract)
        ├── config: IndexPageConfig (セレクタ定義)
        ├── scrapeIndex(url) → EpisodeSummary[]
        ├── extractEpisodes($) → EpisodeSummary[]
        └── abstract scrapeEpisode(url) → EpisodeDetail

            ├── SixMinuteEnglishScraper
            │   ├── quizScraper: SixMinuteEnglishQuizScraper (内部保持)
            │   ├── scrapeEpisode(url) → EpisodeDetail
            │   ├── extractMp3Url($) → string?
            │   ├── extractQuizUrl($) → string?
            │   ├── extractVocabulary($) → VocabularyItem[]
            │   └── extractScript($) → ScriptLine[]
            │
            ├── TheEnglishWeSpeakScraper
            │   ├── scrapeEpisode(url) → EpisodeDetail
            │   ├── extractMp3Url($) → string?
            │   └── extractScript($) → ScriptLine[]
            │   └── (vocabulary: なし, quiz: なし)
            │
            └── RealEasyEnglishScraper
                ├── scrapeEpisode(url) → EpisodeDetail
                ├── extractVocabulary($) → VocabularyItem[]
                └── extractScript($) → ScriptLine[]
                └── (quiz: なし)

BaseScraper (非 IndexPageScraper)
    └── SixMinuteEnglishQuizScraper
        ├── scrapeQuiz(bbcQuizUrl) → QuizQuestion[]
        ├── parseRiddleData(data) → QuizQuestion[]
        └── cleanHtml(html) → string
```

### 各番組の取得内容

| 番組 | Script | Vocabulary | Quiz |
|------|--------|-----------|------|
| 6 Minute English | ✅ | ✅ | ✅ (Riddle.com iframe) |
| The English We Speak | ✅ | ❌ | ❌ |
| Real Easy English | ✅ | ✅ | ❌ |

---

## 5. 型定義 (types.ts)

```typescript
interface ProgramConfig {
  id: string;
  title: string;
  urlPath: string;
  scraperClass: new (baseUrl?: string) => IndexPageScraper;
}

interface EpisodeSummary {
  title: string;
  url: string;
  date?: string;
  description?: string;
}

interface VocabularyItem {
  word: string;
  definition: string;
}

interface ScriptLine {
  speaker: string;
  text: string;
}

interface QuizOption {
  label: string;
  isCorrect: boolean;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  answerIndex: number;
}

interface EpisodeDetail {
  title: string;
  description?: string;
  date?: Date;
  url: string;
  mp3Url?: string;
  script: ScriptLine[];
  vocabulary: VocabularyItem[];
  quizUrl?: string;
  quizContent?: QuizQuestion[];
}
```

---

## 6. Cloud Functions

### 6.1 scheduledScraper

| 項目 | 値 |
|------|-----|
| トリガー | Cloud Scheduler |
| スケジュール | `0 10 * * *` (毎日 10:00 JST) |
| タイムゾーン | Asia/Tokyo |
| リージョン | asia-northeast1 |
| パラメータ | なし |

**処理フロー**:
1. `config.programs` の全番組をループ
2. 番組情報を Firestore に保存 (`saveProgram`)
3. スクレイパーをインスタンス化
4. 目次ページから最新 1 件を取得
5. DB の最新エピソードと URL を比較
6. 新規の場合のみ詳細スクレイピング → DB 保存

### 6.2 manualScraper

| 項目 | 値 |
|------|-----|
| トリガー | HTTP リクエスト |
| リージョン | asia-northeast1 |
| クエリパラメータ | `force` (boolean), `episodes` (number) |

**パラメータ**:
- `force=true`: 重複チェックをスキップし、強制取得・上書き
- `episodes=N`: 最新 N 件を取得 (デフォルト: 1)

**処理フロー**:
1. クエリパラメータから `force` / `maxEpisodes` を取得
2. `runScraper(force, maxEpisodes)` を実行
3. 成功: 200 レスポンス / 失敗: 500 エラー

---

## 7. Repository (database/repository.ts)

```
Repository
├── getLastEpisode(programId) → EpisodeDetail | null
│   └── episodes コレクション / programId + date desc / limit 1
│
├── saveEpisode(programId, episode) → void
│   ├── ドキュメント ID: `{programId}-{slug}` (URL 末尾から生成)
│   ├── programId フィールドを追加
│   ├── updatedAt: serverTimestamp
│   └── merge: true (部分更新)
│
└── saveProgram(program) → void
    ├── ドキュメント ID: program.id
    ├── title, urlPath, baseUrl
    ├── updatedAt: serverTimestamp
    └── merge: true
```

### Firestore 設定

- `ignoreUndefinedProperties: true` — undefined フィールドを無視
- Timestamp → Date 変換: `getLastEpisode` で手動変換

---

## 8. スクレイピング実行フロー

```
runScraper(force, maxEpisodes)
│
├── for each programConfig in config.programs
│   ├── saveProgram(programConfig)
│   ├── new ScraperClass(baseUrl)
│   ├── scraper.scrapeIndex(urlPath) → EpisodeSummary[]
│   │
│   └── for each episode in targetEpisodes (先頭 maxEpisodes 件)
│       ├── [force=false, maxEpisodes=1 の場合]
│       │   ├── getLastEpisode(programId)
│       │   └── URL が一致 → break (スキップ)
│       │
│       ├── scraper.scrapeEpisode(url) → EpisodeDetail
│       │   ├── [SixMinuteEnglish の場合]
│       │   │   └── quizScraper.scrapeQuiz(quizUrl) → QuizQuestion[]
│       │   │       ├── BBC ページから iframe src 取得
│       │   │       ├── Riddle.com ページ取得
│       │   │       ├── window.riddle_view JSON 抽出
│       │   │       ├── vm.runInContext() でパース
│       │   │       └── parseRiddleData() → QuizQuestion[]
│       │   │
│       │   └── [エラー時] ログ出力して continue
│       │
│       └── saveEpisode(programId, detail)
```

---

## 9. 設定 (config.ts)

```typescript
const config = {
  bbc: {
    baseUrl: process.env.BBC_BASE_URL || 'https://www.bbc.co.uk',
  },
  programs: [
    { id: '6-minute-english', title: '6 Minute English', urlPath: '/learningenglish/english/features/6-minute-english', scraperClass: SixMinuteEnglishScraper },
    { id: 'the-english-we-speak', title: 'The English We Speak', urlPath: '/learningenglish/features/the-english-we-speak', scraperClass: TheEnglishWeSpeakScraper },
    { id: 'real-easy-english', title: 'Real Easy English', urlPath: '/learningenglish/english/features/real-easy-english', scraperClass: RealEasyEnglishScraper },
  ],
};
```

---

## 10. IndexPageConfig (共通セレクタ)

3 番組全てで同一のセレクタ構造を使用:

```typescript
{
  listSelector: '.widget-bbcle-coursecontentlist-featured, .widget-progress-enabled li',
  urlSelector: 'a',
  titleSelector: 'h2',
  dateSelector: '.details h3',
  descriptionSelector: 'p'
}
```

---

## 11. 既知の課題・技術的負債

| # | 課題 | 対応Phase |
|---|------|----------|
| 1 | `import-data.ts` が旧フィールド名 (`audioUrl`, `publishedAt`, `sourceUrl`) を使用しており、現在の型定義と不整合 | 1 |
| 2 | `force=false` 時の重複チェックが最新 1 件のみ。`maxEpisodes > 1` 時に過去エピソードの存在チェックが不十分 | 1 |
| 3 | `repository.saveProgram` で `baseUrl` がハードコード (`https://www.bbc.co.uk`) | 1 |
| 4 | Zod バリデーション未導入 — スクレイピング結果の型安全が実行時に保証されない | 1 |
| 5 | 定数 (リージョン、スケジュール、タイムアウト等) が散在 | 1 |
| 6 | テストコード未作成 | 1 |

---

## 12. Phase 1 での改善予定

### 12.1 Zod スキーマ導入

- `packages/shared/` に Zod スキーマを配置し、バックエンド・フロントエンド間で共有
- スクレイピング結果のバリデーション: `EpisodeDetailSchema.parse(detail)` パイプライン
- Firestore 書き込み前のバリデーション追加

### 12.2 定数ファイル整備

```typescript
// backend/src/constants.ts (案)
export const REGION = 'asia-northeast1';
export const SCHEDULE = '0 10 * * *';
export const TIMEZONE = 'Asia/Tokyo';
export const HTTP_TIMEOUT = 10000;
export const MAX_EPISODES_DEFAULT = 1;
```

### 12.3 テスト

- ユニットテスト: 各スクレイパーの `extractXxx` メソッドに対して HTML フィクスチャを使用したテスト
- 結合テスト: Firebase Emulator を使用した `repository` のテスト
- E2E テスト: `manualScraper` の HTTP 呼び出しテスト
