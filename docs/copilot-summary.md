# Copilot サマリー — BBCast

> **最終更新**: 2026-07-17 (Phase 1 — react-native-track-player 移行)

---

## 1. プロジェクト概要

BBC Learning English のコンテンツを自動収集し、英語学習に最適化したモバイルアプリ。
個人の英語学習ツール + 技術ポートフォリオとしての二面性を持つ。

---

## 2. 現在のフェーズ

**Phase 1 — フロントエンド再実装 + バグ修正・基盤導入** (実装完了・レビュー待ち)

- ブランチ: `feature/phase1-foundation` (develop からの feature ブランチ)

---

## 3. リポジトリ構成

```
BBCast/
├── package.json                       # npm workspaces ルート設定
├── .github/
│   ├── copilot-instructions.md        # 開発ワークフロー定義
│   └── workflows/
│       ├── ci.yml                     # CI (develop push / PR → lint + build + test)
│       └── cd-backend.yml             # CD (main push → Functions デプロイ)
├── packages/
│   └── shared/                        # @bbcast/shared — Zod スキーマ + 定数
│       └── src/
│           ├── schemas.ts             # 全 Zod スキーマ定義
│           ├── constants.ts           # PROGRAM_IDS, COLLECTIONS, PAGINATION 等
│           └── index.ts               # バレルエクスポート
├── backend/                           # Cloud Functions (Node.js 22 + TypeScript)
│   └── src/
│       ├── index.ts                   # scheduledScraper / manualScraper
│       ├── scrape.ts                  # スクレイプ実行エンジン
│       ├── config.ts                  # リージョン設定 (@bbcast/shared 参照)
│       ├── database/repository.ts     # Firestore 書き込み (@bbcast/shared 参照)
│       └── scraper/                   # スクレイパー群
├── frontend/                          # React Native + Expo SDK 54
│   ├── app/
│   │   ├── _layout.tsx               # ルートレイアウト (AudioProvider + Auth)
│   │   └── (stack)/                   # Stack ナビゲーション
│   │       ├── _layout.tsx            # Stack 定義
│   │       ├── index.tsx              # 番組一覧
│   │       ├── program/[id].tsx       # エピソード一覧 (無限スクロール)
│   │       └── episode/[id]/          # エピソード詳細
│   │           ├── _layout.tsx        # EpisodeProvider + サブ Stack
│   │           ├── index.tsx          # 詳細メニュー
│   │           ├── transcript.tsx     # スクリプト表示
│   │           ├── vocabulary.tsx     # 語彙リスト
│   │           └── quiz.tsx           # 4択クイズ
│   ├── services/
│   │   ├── firestore.ts               # Firestore データアクセス (Zod バリデーション)
│   │   ├── playback-service.ts        # TrackPlayer バックグラウンド再生ハンドラー
│   │   └── setup-service.ts           # TrackPlayer 初期化
│   ├── contexts/
│   │   ├── audio-context.tsx          # 音声再生 (react-native-track-player)
│   │   └── episode-context.tsx        # エピソードデータ共有
│   ├── components/
│   │   ├── audio-player-bar.tsx       # 永続ミニプレイヤー
│   │   └── ui/icon-symbol.tsx         # アイコンマッピング
│   ├── firebaseConfig.ts              # Firebase 設定 (本番接続)
│   └── constants/theme.ts             # テーマ定数
├── docs/                              # 設計ドキュメント
│   ├── basic-design.md                # 基本設計書 v2
│   ├── copilot-summary.md             # 本ファイル
│   ├── backend/detail-design.md       # バックエンド詳細設計 v2
│   ├── frontend/detail-design.md      # フロントエンド詳細設計 v2
│   ├── database/detail-design.md      # データベース詳細設計 v2
│   ├── adr/                           # Architecture Decision Records
│   │   ├── ADR-001-java-in-devcontainer.md  (Accepted: Java 維持)
│   │   ├── ADR-002-turborepo.md             (Accepted: npm workspaces)
│   │   └── ADR-003-audio-library.md         (Accepted: react-native-track-player)
│   ├── owner-tasks/
│   │   └── setup-cd-secret.md         # CD 用 Firebase サービスアカウント設定手順
│   ├── requirements/s00/              # 要件定義
│   └── archive/                       # 旧設計ドキュメント
├── firebase.json                      # Firebase 設定
├── firestore.rules                    # セキュリティルール (users コレクション追加済み)
└── firestore.indexes.json             # インデックス定義
```

---

## 4. 実装済み機能

### バックエンド (全て実装済み・コミット済み)

- 3 番組のスクレイピング (6 Minute English, The English We Speak, Real Easy English)
- Cloud Functions v2 (scheduledScraper / manualScraper)
- Firestore 書き込み + 重複チェック
- Cloud Scheduler 自動実行 (毎日 10:00 JST)
- **@bbcast/shared 参照**: COLLECTIONS 定数、BBC_CONFIG をバックエンドでも利用

### フロントエンド (Phase 1 で再実装完了)

| 機能 | 状態 |
|------|------|
| Stack ナビゲーション (expo-router) | ✅ 実装済み |
| 番組一覧画面 | ✅ 実装済み |
| エピソード一覧画面 (無限スクロール, 20件/ページ) | ✅ 実装済み |
| エピソード詳細メニュー画面 | ✅ 実装済み |
| スクリプト表示画面 (ScriptLine[] 対応) | ✅ 実装済み |
| 語彙リスト画面 (折りたたみ定義) | ✅ 実装済み |
| 4択クイズ画面 (スコア表示・リトライ) | ✅ 実装済み |
| 音声再生 (react-native-track-player + AudioContext) | ✅ 実装済み |
| 永続ミニプレイヤー (AudioPlayerBar) | ✅ 実装済み |
| Firestore サービス層 (Zod バリデーション) | ✅ 実装済み |
| Firebase 本番接続 | ✅ 実装済み |
| テーマ対応コンポーネント | ✅ 継続使用 |

### 共有パッケージ (@bbcast/shared)

| 機能 | 状態 |
|------|------|
| Zod スキーマ (Program, Episode, ScriptLine, VocabularyItem, QuizQuestion 等) | ✅ 実装済み |
| 共有定数 (PROGRAM_IDS, BBC_CONFIG, COLLECTIONS, PAGINATION) | ✅ 実装済み |
| npm workspaces によるバックエンド・フロントエンドでの共有 | ✅ 実装済み |

### インフラ・CI/CD

| 機能 | 状態 |
|------|------|
| Firestore: programs / episodes コレクション (本番データあり) | ✅ 稼働中 |
| Firebase Auth: Anonymous Auth | ✅ 稼働中 |
| Firestore セキュリティルール (users コレクション対応) | ✅ デプロイ済み |
| CI パイプライン (ci.yml: develop push/PR → build + lint) | ✅ 実装済み |
| CD パイプライン (cd-backend.yml: main push → Functions デプロイ) | ✅ 実装済み |

---

## 5. 既知の課題・技術的負債

| 課題 | Phase | 状態 |
|------|-------|------|
| ~~フロントエンド実装消失~~ | 1 | ✅ 解決済み — 全画面を再実装 |
| ~~`transcript.tsx` 型不整合~~ | 1 | ✅ 解決済み — ScriptLine[] 正しく使用 |
| ~~`import-data.ts` 旧フィールド名~~ | 1 | ✅ 解決済み — ファイル削除 |
| ~~Zod バリデーション未導入~~ | 1 | ✅ 解決済み — @bbcast/shared に統合 |
| ~~定数管理が散在~~ | 1 | ✅ 解決済み — @bbcast/shared/constants |
| ~~CI/CD パイプライン未構築~~ | 1 | ✅ 解決済み — ci.yml + cd-backend.yml |
| Anonymous Auth → Google SSO 移行 | 1-2 | 🔄 未着手 (設計上は任意) |
| ~~React 19 + RN 0.81 JSX 型互換性 (TS2607/TS2786)~~ | — | ✅ 解決済み — @types/react 19.2.14 に更新 |
| npm workspaces ルートスクリプト伝搬問題 | — | ⚠️ CI は直接コマンドで回避済み |
| フロントエンドテスト環境未構築 | 2 | 🔄 未着手 |

---

## 6. フェーズ計画概要

| Phase | 内容 | 状態 |
|-------|------|------|
| 0 | 設計・基盤整備 | ✅ 完了 |
| 1 | フロントエンド再実装 + バグ修正・基盤導入 | 🔄 実装完了・マージ待ち |
| 2 | コア学習機能 (シークバー, 再生速度, チャットUI, PagerView) | ❌ |
| 3 | パーソナライズ (単語帳, 再生履歴, コンテキストメニュー, アナリティクス) | ❌ |
| 4 | オフライン/カーステモード (ダウンロード, プレイリスト, プリセット) | ❌ |
| 5 | リリース自動化 (CD — APK ビルド + GitHub Release) | ❌ |

詳細は `docs/basic-design.md` のセクション 9 を参照。

---

## 7. ADR 決定事項

| ADR | トピック | ステータス | 決定内容 |
|-----|---------|-----------|--------|
| ADR-001 | DevContainer の Java 21 feature | ✅ Accepted | Java 維持。ローカル APK ビルドの選択肢を残す |
| ADR-002 | Turborepo vs npm workspaces | ✅ Accepted | npm workspaces を採用。Turborepo は不採用 |
| ADR-003 | 音声ライブラリ選定 | ✅ Accepted | Phase 1 で react-native-track-player に移行。Expo Go 離脱・ローカル Development Build |

---

## 8. 技術スタック

### 共通

Zod 3.25.x / @bbcast/shared (npm workspaces 共有パッケージ)

### バックエンド

Node.js 22 / TypeScript 5.9.x / Cloud Functions v2 / axios + cheerio / firebase-admin 13.x / Zod

### フロントエンド

React Native 0.81.x + Expo SDK 54 / React 19.1.x / TypeScript 5.9.x / expo-router 6.x / react-native-track-player 4.x (音声再生) / Firebase JS SDK 12.x / Zod

### 認証

Firebase Auth — Anonymous Auth (Google SSO は Phase 1-2 で任意導入予定)

### CI/CD

GitHub Actions — CI (develop push/PR) + CD (main push → Functions デプロイ)

---

## 9. Phase 1 実装詳細

### 9.1 npm workspaces 構成

- ルート `package.json` で `packages/*`, `backend`, `frontend` をワークスペース定義
- `@bbcast/shared` パッケージ: Zod スキーマ + 定数を一元管理
- 既知問題: npm 10.x で `npm run` がワークスペース全体に伝搬するため、CI では `cd X && command` を使用

### 9.2 フロントエンドアーキテクチャ

- **ナビゲーション**: tabs テンプレートを削除し、Stack ナビゲーションに変更
- **画面構成**: 番組一覧 → エピソード一覧 → エピソード詳細 (メニュー / スクリプト / 語彙 / クイズ)
- **データ取得**: `services/firestore.ts` で Firestore 直接参照 + Zod バリデーション
- **音声再生**: `react-native-track-player` ベースの `AudioContext` + 永続 `AudioPlayerBar`
  - `services/playback-service.ts`: バックグラウンド再生イベントハンドラー
  - `services/setup-service.ts`: TrackPlayer 初期化
  - `_layout.tsx` でモジュールスコープ登録 + useEffect 初期化
- **コンテキスト**: `AudioProvider` (ルート), `EpisodeProvider` (エピソード詳細)
- **ビルド**: Expo Go 不使用。`expo prebuild` → `expo run:android` で Development Build (ADR-003)

### 9.3 バックエンド変更

- `@bbcast/shared` から COLLECTIONS, BBC_CONFIG 定数をインポート
- `types.ts` を共有スキーマの re-export に変更
- `import-data.ts` を削除 (旧スキーマで使用不可)

### 9.4 セキュリティルール

- Firestore rules に `users/{userId}` および `users/{userId}/{subcol=**}` を追加
- `isOwner()` ヘルパー関数を定義
- 本番環境にデプロイ済み

---

## 10. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-19 | Phase 0 開始。基本設計書 v2 策定。ADR-001, ADR-002 作成。詳細設計書 v2 更新。copilot-instructions.md, copilot-summary.md 作成。 |
| 2026-03-19 | ADR-001 Accepted (Java 維持)、ADR-002 Accepted (npm workspaces 採用, Turborepo 不採用)。アナリティクス設計を episodeProgress 内訳方式に変更。 |
| 2026-03-19 | フロントエンド実装コード消失を記録。Phase 1 にフロントエンド再実装タスクを追加。ドキュメント全体を再作成。 |
| 2026-07-17 | **Phase 1 実装完了**: npm workspaces + @bbcast/shared, フロントエンド全画面再実装 (Stack ナビ, 番組一覧, エピソード一覧/詳細, スクリプト, 語彙, クイズ, 音声再生), CI/CD パイプライン, Firestore セキュリティルール更新, import-data.ts 削除, バックエンド共有パッケージ統合。 |
| 2026-07-17 | **音声ライブラリ移行**: ADR-003 承認。expo-av → react-native-track-player 4.x に移行。PlaybackService / SetupService 作成。DevContainer に Android SDK 追加 (Dockerfile 更新)。app.json に android.package 追加。Expo Go 離脱・ローカル Development Build 方針に転換。 |
| 2026-03-20 | **DevContainer 修正**: Java feature → Dockerfile 内 `apt-get install openjdk-21-jdk-headless` に変更 (sdkmanager が Java を必要とするためビルド順序の問題を解消)。ADR-001 に実装変更を追記。.gitignore に docs/requirements/ を追加。 |
