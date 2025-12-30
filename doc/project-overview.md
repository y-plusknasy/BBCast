# プロジェクト概要 (Project Overview)

## 1. プロジェクトの目的と位置付け
本プロジェクト「BBC Learning English Aggregator」は、BBC Learning Englishのコンテンツを活用し、個人の英語学習を効率化・最適化するためのモバイルアプリケーション開発プロジェクトです。

**【重要】本プロジェクトの公開・運用に関する方針**
本アプリは、開発者個人の学習およびポートフォリオ（技術力の証明）を目的としています。
*   **非公開運用**: 著作権およびインフラコストの観点から、一般向けのサービス公開は行いません。
*   **限定配布**: 開発者が許可した者を対象とした限定的なパッケージ配布（APK/TestFlight等）のみを想定しています。
*   **オープンソース**: ソースコード自体はGitHubにて公開しますが、著作権を含むコンテンツデータや、APIキー等の機密情報はリポジトリに含めません。

主な目的は以下の通りです：
*   **英語学習の効率化**: 以下の主要な3番組の音声・スクリプト・語彙リストへ、単一のアプリから即座にアクセス可能にします。
    *   6 Minute English
    *   The English We Speak
    *   Real Easy English
*   **学習体験の向上**: オフライン再生やスクリプトの同期表示により、通勤・通学中などの隙間時間を有効活用できる環境を提供します。
*   **技術的挑戦**: React Nativeによるクロスプラットフォーム開発、GCPを用いたサーバーレスアーキテクチャ、およびスクレイピング技術の実践的な習得を目指します。

## 2. 技術スタック
本プロジェクトでは、開発効率と運用コストのバランスを考慮し、以下の技術スタックを採用します。

### フロントエンド (Mobile App)
*   **Framework**: React Native (Expo)
    *   クロスプラットフォーム（iOS/Android）対応と開発スピードを重視。
*   **Language**: TypeScript
*   **State Management**: React Context API / Hooks (必要に応じてRedux/Zustand等を検討)

### バックエンド (Backend)
*   **Runtime**: Node.js (TypeScript)
*   **Framework**: Express (Cloud Functions内で使用する場合) または軽量なハンドラ構成

### インフラストラクチャ (Infrastructure - GCP)
*   **Compute**: Google Cloud Functions (2nd gen)
    *   サーバーレスでイベント駆動型の処理を実行（スクレイピング、API）。
*   **Database**: Firestore (Native mode)
    *   NoSQLドキュメントデータベースとして、番組情報やエピソードデータを格納。
*   **Storage**: Google Cloud Storage (GCS)
    *   音声ファイルの一時的な中継やキャッシュとして利用（運用コスト削減のため、永続化は最小限に留める方針）。
*   **Scheduler**: Cloud Scheduler
    *   定期的なスクレイピングジョブのトリガー。

### ツール・ライブラリ
*   **Scraping**: Axios, Cheerio
*   **CI/CD**: GitHub Actions (予定)

## 3. 開発方針
高品質かつ保守性の高いシステムを構築するため、以下の原則に従って開発を進めます。

### ドメイン駆動設計 (DDD: Domain-Driven Design) の意識
*   **ドメインロジックの分離**: スクレイピングロジックやデータ変換ルールを、インフラ層（Firestore/Cloud Functions）から切り離し、純粋なTypeScriptクラス/関数として実装します。
*   **抽象化**: `BaseScraper` などの抽象クラスを定義し、番組ごとのHTML構造の違いをConfiguration（設定）や具体的な実装クラスで吸収します。

### ステートレス設計 (Stateless Architecture)
*   **サーバーレスの特性活用**: Cloud Functionsはステートレスに動作することを前提とし、サーバー側にセッション状態を保持しません。
*   **クライアント主導**: 認証情報や学習進捗などの状態は、主にクライアント側またはFirestoreで管理し、サーバーインスタンスへの依存を排除します。

### 運用コストの最小化 (Cost Optimization)
*   **サーバーレス・ストレージレス**: 常時稼働するサーバーを持たず、必要な時だけリソースを消費する構成とします。
*   **データ転送の最適化**: 音声ファイルは可能な限りオリジナルのURLを参照するか、一時的なキャッシュのみを行い、ストレージコストを抑制します。
