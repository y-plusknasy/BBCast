# CD 用 Firebase サービスアカウント設定

## 目的

GitHub Actions から Firebase Functions をデプロイするためのサービスアカウントキーを GitHub Secrets に設定する。

## 手順

### 1. Firebase サービスアカウントキーの取得

1. [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=bbcast-backend) にアクセス
2. `firebase-adminsdk` で始まるサービスアカウントを選択
3. 「キー」タブ → 「鍵を追加」→「新しい鍵を作成」
4. JSON 形式を選択してダウンロード

### 2. GitHub Secrets への登録

1. GitHub リポジトリの Settings → Secrets and variables → Actions
2. 「New repository secret」をクリック
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: ダウンロードした JSON ファイルの**内容全体**を貼り付け
5. 「Add secret」をクリック

### トラブルシューティング

| 問題 | 対処法 |
|------|--------|
| `Permission denied` エラー | サービスアカウントに `Cloud Functions Admin` ロールが付与されているか確認 |
| `Build failed` | ローカルで `npm run build:backend` が通るか確認 |
| Secrets が読めない | fork からの PR ではシークレットは利用不可 |
