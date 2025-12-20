# System Design Document: BBC Learning English Aggregator

## 1. Project Overview
BBC Learning Englishから複数のプログラム（番組）のコンテンツを自動収集し、個人の英語学習を最適化するためのモバイルファーストなプラットフォーム。

### Objectives
* **英語学習の効率化**: 音声・スクリプト・語彙への即時アクセス。
* **技術スタックの習得**: スクレイピング、サーバーレスアーキテクチャ、React Nativeの開発経験。
* **運用コストの最小化**: GCPの無料枠を最大限活用した「サーバーレス・ストレージレス」運用。

## 2. Tech Stack
* **Frontend**: React Native (Expo)
* **Backend**: Node.js (TypeScript)
* **Infrastructure**: Google Cloud Platform (GCP)
    * **Functions**: Cloud Functions (2nd gen) - 実行環境
    * **Database**: Firestore (Native mode) - テキストデータ保存
    * **Storage**: Google Cloud Storage (GCS) - 音声の一時中継用
* **Scraping**: Axios, Cheerio

## 3. Architecture & Data Flow



1.  **Trigger**: Cloud Schedulerによる定期実行、またはAppからの手動同期リクエスト。
2.  **Scraper (Cloud Functions)**: 
    * Firestoreから対象プログラムのリストとセレクタ設定を取得。
    * BBCサイトを巡回し、新着エピソードのHTMLを解析。
    * テキスト（タイトル・スクリプト・語彙）を抽出し、Firestoreへ保存。
3.  **Audio Hosting**: 
    * オリジナルのmp3 URLをFirestoreに保持。
    * アプリ側でのダウンロード要求時のみ、サーバーを経由して提供（または一時保存後に削除）。
4.  **Client (React Native)**:
    * Firestoreからメタデータを取得。
    * 音声とスクリプトを端末ローカルに保存し、オフライン学習に対応。

## 4. Data Model (Firestore)

### `programs` (Collection)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | 一意のID (例: 6-minute-english) |
| `title` | string | 番組名 |
| `baseUrl` | string | 番組のトップURL |
| `isActive` | boolean | スクレイピング実行対象か |
| `config` | map | `listSelector`, `itemSelector` 等のパース設定 |

### `episodes` (Collection)
| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | string | programId + slug |
| `programId` | string | 親番組への参照 |
| `title` | string | エピソードタイトル |
| `publishDate` | timestamp | 公開日 |
| `audioUrl` | string | mp3ファイルのURL |
| `script` | string | 解析済みスクリプトテキスト |
| `vocabulary` | array | `{word, definition}` のリスト |

## 5. Development Principles (Constraints)
* **Abstraction**: `BaseScraper`クラスを定義し、番組ごとの差異は設定値（Config）で吸収する。
* **Storage Optimization**: GCS上の音声ファイルは、スマホへの転送完了後、または一定時間後に自動削除するライフサイクル設定を行う。
* **Stateless**: サーバー側にセッションを持たず、Cloud Functionsの特性を活かす。

## 6. Implementation Roadmap
1. **Phase 1 (Scraper)**: 複数番組に対応した汎用スクレイピングエンジンの構築。
2. **Phase 2 (Backend)**: Firestore連携およびCloud Functionsへのデプロイ。
3. **Phase 3 (Mobile)**: React NativeによるUIおよび同期ロジックの実装。
4. **Phase 4 (Learning)**: 音声再生・単語クイズ・オフラインモードの実装。
