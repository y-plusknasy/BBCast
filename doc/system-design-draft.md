# System Design Document: BBC Learning English Aggregator

## 1. Project Overview
BBC Learning Englishから複数のプログラム（番組）のコンテンツを自動収集し、個人の英語学習を最適化するためのモバイルファーストなプラットフォーム。

### Objectives
* **英語学習の効率化**: 音声・スクリプト・語彙・クイズへの即時アクセス。
* **技術スタックの習得**: スクレイピング、サーバーレスアーキテクチャ、React Nativeの開発経験。
* **運用コストの最小化**: GCPの無料枠を最大限活用した「サーバーレス・ストレージレス」運用。

## 2. Tech Stack
* **Frontend**: React Native (Expo)
* **Backend**: Node.js (TypeScript)
* **Infrastructure**: Firebase (Google Cloud Platform)
    * **Functions**: Cloud Functions (2nd gen) - スクレイピング実行・API
    * **Database**: Firestore (Native mode) - データ永続化
    * **Authentication**: Firebase Auth (Anonymous) - ポートフォリオ閲覧用
    * **Emulator**: Firebase Emulator Suite - ローカル開発環境
* **Scraping**: Axios, Cheerio, Node.js `vm` (for Quiz parsing)

## 3. Architecture & Data Flow

1.  **Trigger**: Cloud Schedulerによる定期実行、またはAppからの手動同期リクエスト。
2.  **Scraper (Cloud Functions)**: 
    * BBCサイトを巡回し、新着エピソードのHTMLを解析。
    * `vm` モジュールを使用して、外部JSオブジェクト（Riddle.com）からクイズデータを抽出。
    * テキスト（タイトル・スクリプト・語彙・クイズ）を抽出し、Firestoreへ保存。
3.  **Data Persistence**:
    * Firestoreの `episodes` コレクションに一元管理。
    * ドキュメントIDにはエピソードID（例: `251218`）を使用し、冪等性を担保。
4.  **Client (React Native)**:
    * Firestoreからデータを取得。
    * 匿名認証（Anonymous Auth）を使用してセキュアにアクセス。

## 4. Data Model (Firestore)

詳細なスキーマ定義は [doc/database/schema.md](doc/database/schema.md) を参照。

### `episodes` (Collection)
全番組のエピソードをこのコレクションに格納し、`programTitle` でフィルタリングして使用する。
ドキュメントIDにはエピソードID（例: `251218`）を使用し、データの重複を防ぐ。

## 5. Local Development Environment
* **DevContainer**: 
    * Base: Debian GNU/Linux 13 (trixie)
    * Languages: Node.js, TypeScript, Java 21 (for Firebase Emulators)
    * Tools: Firebase CLI, GitHub CLI
* **Firebase Emulators**:
    * Firestore: Port 8080 (Host: 0.0.0.0)
    * Auth: Port 9099 (Host: 0.0.0.0)
    * UI: Port 4000 (Host: 0.0.0.0)

## 6. Implementation Roadmap
1. **Phase 1 (Scraper)**: [Completed]
    * 汎用スクレイピングエンジンの構築。
    * クイズデータのパース実装 (`vm` module)。
2. **Phase 2 (Backend)**: [In Progress]
    * Firestore設計とエミュレータ環境構築。
    * データインポートスクリプトの実装。
3. **Phase 3 (API/Functions)**: 
    * Cloud Functionsへのデプロイ。
    * 定期実行トリガーの設定。
4. **Phase 4 (Mobile)**: 
    * React NativeによるUI実装。
    * Firestore SDKの組み込み。
