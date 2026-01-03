# 開発・運用ワークフロー (Development & Operations Workflow)

## 1. ブランチ戦略 (Branching Strategy)

本プロジェクトでは、**GitHub Flow** をベースに、開発用ブランチ (`develop`) を組み込んだフローを採用します。

### ブランチ構成
*   **`main`**: 本番環境 (Production) 用ブランチ。
    *   常にデプロイ可能な状態を維持します。
    *   このブランチへのマージ（Push）をトリガーに、本番環境へ自動デプロイ (CD) が実行されます。
*   **`develop`**: 開発統合用ブランチ。
    *   機能追加やバグ修正の統合先です。
    *   このブランチへのマージ（Push）をトリガーに、自動テスト (CI) が実行されます。
*   **`feature/xxx`**: 作業用ブランチ。
    *   `main` (または `develop`) から派生し、個別のタスクを行います。

### ワークフロー
1.  **Coding**: `feature/xxx` ブランチで開発を行う。
2.  **Merge to Develop**: 作業完了後、`develop` ブランチへマージする。
    *   GitHub Actions (CI) が実行され、ビルド・テストが行われる。
3.  **Verification**: 開発者がローカル環境で動作確認を行う（後述の「開発環境」参照）。
4.  **Merge to Main**: 動作確認完了後、`develop` を `main` へマージする。
    *   GitHub Actions (CD) が実行され、本番環境へデプロイされる。

## 2. 開発環境とテスト方針 (Development Environment)

フロントエンドとバックエンドで、接続先や確認方法を使い分けます。

### 2.1. Frontend開発 (UI/UX)
*   **実行環境**: Android Emulator / iOS Simulator (または実機)
*   **接続先バックエンド**: **本番環境 (Production Firebase)**
    *   Firebase Emulator Suite のセットアップコストを削減するため、開発中も本番環境のFirestore/Functionsを利用します。
    *   `firebaseConfig` には本番環境の認証情報を設定します。
*   **確認方法**:
    *   アプリを起動し、本番データ（スクレイピング済みのエピソード等）が表示されることを確認します。

#### 開発環境の起動方法

##### 【推奨】USB 接続による開発
**Background**: `npx expo start --tunnel` は、ユーザー名にアンダースコア (`_`) が含まれる場合、DNS 標準 (STD 3) に違反するため URL が生成できない問題があります。

**解決策**: Android 実機を USB 接続し、adb を使用して Metro Bundler に接続します。

```bash
# 1. Android 端末を USB で接続し、USB デバッグを有効化

# 2. adb でポートフォワーディングを設定
adb reverse tcp:8081 tcp:8081

# 3. Metro Bundler を起動（tunnel なし）
cd frontend
npx expo start --clear --dev-client

# 4. Development Build アプリから「Enter URL manually」で接続
# URL: http://localhost:8081
```

**Dev Container の場合**: `.devcontainer/devcontainer.json` の `forwardPorts` に `8081` を追加して、ホスト側からもアクセス可能にします。

##### Tunnel 接続（アンダースコアなしのユーザー名の場合のみ）
```bash
cd frontend
npx expo start --tunnel --dev-client
```

### 2.2. Backend開発 (Scraping/DB Logic)
*   **実行環境**: ローカルマシン (Node.js)
*   **接続先バックエンド**: **Firebase Emulator Suite (Local)**
    *   本番データを汚染するリスクを避けるため、ロジック変更時はローカルのエミュレータを使用します。
*   **確認方法**:
    *   `npm run serve` でエミュレータを起動。
    *   テストスクリプトを実行し、ローカルのFirestoreエミュレータにデータが正しく保存されるか確認します。

## 3. CI/CD パイプライン (GitHub Actions)

### Workflow A: CI (Integration)
*   **Trigger**: `develop` ブランチへの Push / Pull Request
*   **Jobs**:
    *   `lint`: コード規約チェック (ESLint)
    *   `build`: ビルドチェック (TypeScript Compile)
    *   `test`: 単体テスト実行 (Jest)

### Workflow B: CD (Deployment)
*   **Trigger**: `main` ブランチへの Push
*   **Jobs**:
    *   `deploy`: Firebaseへのデプロイ
        *   `firebase deploy --only functions,firestore`

## 4. セキュリティ (Security)
*   **Firestore Rules**:
    *   本番環境では、クライアントからの書き込みを禁止し、読み取りのみを許可する設定を適用します。
    *   バックエンド（Cloud Functions）からの書き込みは Admin SDK を使用するため、ルールに関わらず可能です。
