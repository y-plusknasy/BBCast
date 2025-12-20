# アーキテクチャ設計書 (Architecture Document)

## 1. システム構成図 (System Architecture)

本システムは、Google Cloud Platform (GCP) を活用したサーバーレスアーキテクチャを採用しています。

```mermaid
graph TD
    subgraph Client [Mobile App (React Native)]
        App[App UI]
        LocalDB[Local Storage / SQLite]
    end

    subgraph GCP [Google Cloud Platform]
        Scheduler[Cloud Scheduler]
        CF[Cloud Functions (Scraper)]
        Firestore[(Firestore)]
        GCS[Cloud Storage (Optional Cache)]
    end

    subgraph External [External Source]
        BBC[BBC Learning English Website]
    end

    %% Flows
    Scheduler -- "Trigger (Cron)" --> CF
    App -- "Trigger (Manual Sync)" --> CF
    CF -- "HTTP Request" --> BBC
    BBC -- "HTML / MP3" --> CF
    CF -- "Save Metadata & Text" --> Firestore
    CF -- "Cache Audio (Temp)" --> GCS
    
    App -- "Read Metadata" --> Firestore
    App -- "Download Audio" --> GCS
    App -- "Direct Audio Stream (Fallback)" --> BBC
    
    %% Local Sync
    Firestore -.-> App
    App --> LocalDB
```

## 2. データフロー (Data Flow)

### 2.1. スクレイピングフロー (Backend)
1.  **Trigger**: 
    *   `Cloud Scheduler` が定期的に（例: 毎日深夜）、またはアプリからのリクエストにより `Cloud Functions` を起動します。
2.  **Fetch Config**:
    *   Scraperは `Firestore` の `programs` コレクションから、スクレイピング対象の番組リストと設定（URL, セレクタ等）を取得します。
3.  **Scrape & Parse**:
    *   BBCのWebサイトへアクセスし、最新エピソードのHTMLを取得・解析します。
    *   タイトル、スクリプト、語彙、音声URLを抽出します。
4.  **Persist**:
    *   抽出したデータを `Firestore` の `episodes` コレクションに保存（または更新）します。
    *   （オプション）音声ファイルを一時的に `Cloud Storage` へダウンロードし、アプリ向けに最適化して配置します。

### 2.2. アプリ利用フロー (Frontend)
1.  **Sync**:
    *   アプリ起動時またはユーザー操作時に、`Firestore` から最新の番組・エピソード情報を取得します。
2.  **Cache**:
    *   取得したテキストデータ（スクリプト等）をローカルストレージに保存します。
    *   ユーザーが「ダウンロード」を選択した場合、音声ファイルをローカルに保存します。
3.  **Playback & Study**:
    *   ローカルまたはリモートの音声ファイルを再生しながら、スクリプトを表示します。

## 3. データモデル設計 (Data Model)

Firestore (Native mode) を使用し、以下のコレクション構造でデータを管理します。

### 3.1. `programs` Collection
番組（シリーズ）ごとのメタデータとスクレイピング設定を管理します。

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` (Document ID) | string | 番組の一意なID | `6-minute-english` |
| `title` | string | 番組名 | `6 Minute English` |
| `description` | string | 番組概要 | `Learn English in 6 minutes...` |
| `baseUrl` | string | 番組のトップページURL | `https://www.bbc.co.uk/...` |
| `isActive` | boolean | スクレイピング実行対象フラグ | `true` |
| `config` | map | スクレイピング設定 | `{ listSelector: ".widget...", ... }` |
| `lastScrapedAt` | timestamp | 最終スクレイピング日時 | `2023-10-27T10:00:00Z` |

### 3.2. `episodes` Collection
各エピソードの詳細データを格納します。

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `id` (Document ID) | string | 一意なID (programId + slug) | `6-minute-english-231026` |
| `programId` | string | 親番組ID (`programs`への参照) | `6-minute-english` |
| `title` | string | エピソードタイトル | `Coffee: Is it good for you?` |
| `slug` | string | URLスラッグ | `coffee-good-for-you` |
| `publishDate` | timestamp | 公開日 | `2023-10-26T00:00:00Z` |
| `audioUrl` | string | 音声ファイルのURL (Original or GCS) | `https://.../coffee.mp3` |
| `imageUrl` | string | サムネイル画像URL | `https://.../img.jpg` |
| `script` | string | スクリプト全文 (Markdown/HTML) | `Hello. This is 6 Minute English...` |
| `vocabulary` | array | 語彙リスト | `[{word: "caffeine", def: "..."}]` |
| `duration` | number | 音声の長さ（秒） | `360` |

### 3.3. `users` Collection (Optional / Future)
ユーザーごとの学習進捗を管理する場合に使用します（認証導入後）。

| Field | Type | Description |
| :--- | :--- | :--- |
| `uid` (Document ID) | string | ユーザーID |
| `bookmarks` | array | ブックマークしたエピソードID |
| `history` | sub-collection | 再生履歴 |
