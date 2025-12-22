# BBCast (BBC Learning English Aggregator)

BBC Learning Englishのコンテンツを活用し、英語学習を効率化するためのモバイルアプリケーションプロジェクトです。
本リポジトリは、開発者の技術ポートフォリオとして公開されています。

**⚠️ 注意 (Disclaimer)**
*   本アプリは**非公開・個人利用**を前提としています。
*   BBC (British Broadcasting Corporation) の公式アプリではありません。
*   著作権保護のため、本リポジトリには音声ファイルやスクリプトなどのコンテンツデータは含まれていません。

## 📂 リポジトリ構成 (Repository Structure)

本リポジトリは、フロントエンドとバックエンドを単一のリポジトリで管理するモノレポ構成を採用しています。

```
.
├── doc/                # 設計ドキュメント
├── frontend/           # [Mobile App] React Native (Expo) アプリケーションコード
├── backend/            # [Backend] Cloud Functions (Scraper & API) コード
├── .devcontainer/      # [Dev Env] VS Code Dev Container 設定
└── firebase.json       # Firebase 設定ファイル
```

## 🚀 開発環境のセットアップ (Getting Started)

### 前提条件 (Prerequisites)
*   Docker Desktop (または互換コンテナランタイム)
*   VS Code + Dev Containers 拡張機能

### セットアップ手順
1.  VS Codeで本フォルダを開きます。
2.  "Reopen in Container" を選択して、Dev Containerを起動します。
3.  自動的に `backend` と `frontend` の依存関係がインストールされます。

### 開発コマンド

#### バックエンド (Firebase Emulators)
ローカルでFirestoreとAuthのエミュレータを起動します。
```bash
firebase emulators:start
```
*   Emulator UI: http://localhost:4000
*   Firestore: http://localhost:8080
*   Auth: http://localhost:9099

#### フロントエンド (Expo)
```bash
cd frontend
npm start
```
*   Expo GoアプリでQRコードをスキャンするか、`w` キーでWeb版を起動して確認します。

## 📚 ドキュメント (Documentation)
*   [システム設計書 (System Design)](doc/system-design-draft.md)
*   [アーキテクチャ (Architecture)](doc/architecture.md)
*   [データベーススキーマ (Database Schema)](doc/database/schema.md)

## 🛠 技術スタック (Tech Stack)
*   **Frontend**: React Native (Expo), TypeScript
*   **Backend**: Node.js, Google Cloud Functions
*   **Database**: Firestore (Native mode)
*   **Infrastructure**: Firebase (Auth, Emulators)
