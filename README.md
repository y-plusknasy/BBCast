# BBC Learning English Aggregator

BBC Learning Englishのコンテンツを活用し、英語学習を効率化するためのモバイルアプリケーションプロジェクトです。
本リポジトリは、開発者の技術ポートフォリオとして公開されています。

**⚠️ 注意 (Disclaimer)**
*   本アプリは**非公開・個人利用**を前提としています。
*   BBC (British Broadcasting Corporation) の公式アプリではありません。
*   著作権保護のため、本リポジトリには音声ファイルやスクリプトなどのコンテンツデータは含まれていません。
*   本コードを使用して発生したいかなる問題についても、開発者は責任を負いません。

## 📂 リポジトリ構成 (Repository Structure)

本リポジトリは、機密情報や著作権物を排除しつつ、アプリケーションのビルドとデプロイが可能な構成になっています。

```
.
├── doc/                # 設計ドキュメント
├── app/                # React Native (Expo) アプリケーションコード
├── functions/          # Cloud Functions (Backend) コード
├── firebase.json       # Firebase構成ファイル
├── .gitignore          # 除外設定
└── README.md           # 本ファイル
```

## 🔐 環境設定とセキュリティ (Configuration & Security)

本プロジェクトでは、APIキーや認証情報などの機密情報を環境変数 (`.env`) で管理しています。
リポジトリをクローンして動作させる場合は、以下の手順で環境変数を設定する必要があります。

### 1. 環境変数の準備
ルートディレクトリに `.env` ファイルを作成し、以下の変数を設定してください。

```bash
# Firebase Client Config (for App)
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
# ... other firebase config

# Backend Config (for Cloud Functions)
BBC_BASE_URL=https://www.bbc.co.uk/learningenglish
```

### 2. Firebase Setup
本アプリはバックエンドにFirebase (Firestore, Functions, Auth) を使用しています。
自身のFirebaseプロジェクトを作成し、`firebase-tools` を使用してデプロイ環境を構築してください。

## 🚀 配布・インストール (Distribution)

本アプリは一般公開されていません。
開発者から提供されたパッケージ (APK/TestFlight) を使用するか、自身でビルドを行ってください。

### 認証について
アプリの利用にはログインが必要です。
ポートフォリオ閲覧用のアカウント情報については、開発者までお問い合わせください。

## 🛠 技術スタック (Tech Stack)

*   **Frontend**: React Native (Expo), TypeScript
*   **Backend**: Node.js, Google Cloud Functions
*   **Database**: Firestore
*   **Infrastructure**: Google Cloud Platform (GCP)
