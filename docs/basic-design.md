# 基本設計書 — BBCast (BBC Learning English Aggregator)

> **ステータス**: v2 策定完了 (2026-03-19)  
> **前版**: `docs/archive/basic-design-v1.md`  
> **要件入力**: `docs/requirements/s00/initial-requirement.md`

---

## ドキュメント構成

| パス | 内容 |
|------|------|
| `docs/basic-design.md` | **本ファイル** — 全体設計・フェーズ計画・テスト・リリース |
| `docs/backend/detail-design.md` | バックエンド詳細設計 |
| `docs/frontend/detail-design.md` | フロントエンド詳細設計 |
| `docs/database/detail-design.md` | Firestore スキーマ詳細設計 |
| `docs/adr/` | ADR (Architecture Decision Records) |
| `docs/owner-tasks/` | オーナー手動操作の手順書 |
| `docs/troubleshooting.md` | トラブルシューティング記録 |
| `docs/workflow.md` | 開発・運用ワークフロー |
| `docs/copilot-summary.md` | Copilot 用フェーズ開始時の読み込みサマリー |
| `docs/requirements/` | 要件定義（スプリントごと） |
| `docs/archive/` | 旧設計ドキュメント（参考資料） |

---

## 1. プロジェクト概要

### 1.1 目的・位置付け

BBC Learning English のコンテンツを自動収集し、英語学習に最適化したモバイルアプリを提供するプロジェクト。

| 項目 | 内容 |
|------|------|
| プロジェクト名 | BBCast (BBC Learning English Aggregator) |
| 目的 | 開発者個人の英語学習 + **技術ポートフォリオ** |
| 配布方針 | 非公開運用。GitHub Release（APK/IPA）で限定配布 |
| ソースコード | GitHub 公開（機密情報・著作権コンテンツは含まない） |
| 技術方針 | **最新技術（安定版）を積極導入**。UX は一定水準でよく、ポートフォリオ性を重視 |

### 1.2 対象番組

| 番組 ID | 番組名 |
|---------|--------|
| `6-minute-english` | 6 Minute English |
| `the-english-we-speak` | The English We Speak |
| `real-easy-english` | Real Easy English |

---

## 2. システムアーキテクチャ

### 2.1 全体構成

```
┌─────────────────────────────────────────────────────────────┐
│                    GCP / Firebase                            │
│                                                             │
│  ┌──────────────────────┐    ┌──────────────────────────┐   │
│  │  Cloud Functions 2nd  │    │       Firestore           │   │
│  │  (asia-northeast1)    │───▶│  (asia-northeast1)        │   │
│  │                       │    │  - programs               │   │
│  │  scheduledScraper     │    │  - episodes               │   │
│  │  manualScraper (HTTP) │    │  - users/{uid}            │   │
│  └──────────────────────┘    │    └ episodeProgress      │   │
│           ▲                   │    └ wordbook             │   │
│  ┌────────┴───────────┐      └──────────────────────────┘   │
│  │  Cloud Scheduler   │                 ▲                    │
│  │  (毎日 10:00 JST)  │                 │                    │
│  └────────────────────┘                 │                    │
│                                         │                    │
│  ┌──────────────────────┐               │                    │
│  │  Firebase Auth        │────┐          │                    │
│  │  (Google SSO)         │    │          │                    │
│  └──────────────────────┘    │          │                    │
└──────────────────────────────┼──────────┼────────────────────┘
                               │          │ Firestore SDK
                               │ Auth     │ (Google SSO JWT)
┌──────────────────────────────┼──────────┼────────────────────┐
│               Mobile App (Expo)         │                    │
│                                         │                    │
│  React Native + Expo SDK 54             │                    │
│  expo-router (Drawer + Stack + PagerView)                    │
│  react-native-track-player v5           │                    │
│  react-native-credentials-manager       │                    │
│  Zod (スキーマバリデーション)              │                    │
│  Firebase JS SDK v12                    │                    │
└──────────────────────────────────────────────────────────────┘
```

### 2.2 データフロー

```
BBC サイト
  │  HTTP GET (axios + User-Agent)
  ▼
Cloud Functions (Scraper)
  │  IndexPageScraper → エピソード URL 一覧取得
  │  XxxScraper → 各エピソード詳細スクレイプ
  │  Firebase Admin SDK (Write)
  ▼
Firestore (programs / episodes)
  │  Firebase JS SDK (Read)
  ▼
Mobile App ──── Google SSO 認証 ──── Firebase Auth
  │  ├─ 番組一覧 → エピソード一覧 → エピソード詳細
  │  ├─ 音声再生 / ダウンロード → カーステモード
  │  ├─ クイズ / 単語帳 / スクリプト（チャット UI）
  │  └─ ユーザーアクションデータ → Firestore (episodeProgress)
  ▼
ユーザー
```

---

## 3. 技術スタック

### 3.1 バックエンド (Cloud Functions)

| 項目 | 内容 |
|------|------|
| Runtime | Node.js 22 |
| Language | TypeScript 5.9.x |
| スクレイピング | axios + cheerio |
| バリデーション | **Zod** (新規導入) |
| Firebase Admin SDK | firebase-admin |
| Firebase Functions | firebase-functions v2 |
| クイズパース | Node.js `vm` モジュール |

### 3.2 フロントエンド (Mobile App)

| 項目 | 内容 |
|------|------|
| Framework | React Native 0.81.x + Expo SDK 54 |
| Language | TypeScript 5.9.x |
| Architecture | New Architecture (TurboModules) 有効化 |
| ルーター | expo-router |
| ナビゲーション | @react-navigation/drawer + @react-navigation/native |
| 画面スワイプ | **react-native-pager-view** (新規導入) |
| 音声再生 | react-native-track-player ^4.1.2 (patch-package でKotlin 2.1.20互換パッチ適用) |
| 認証 | Firebase Auth (現状: Anonymous Auth。Google SSO は将来フェーズで導入予定) |
| バリデーション | **Zod** (新規導入) |
| Firebase SDK | firebase |
| React | 19.x |

### 3.3 インフラ (GCP / Firebase)

| 項目 | 内容 |
|------|------|
| データベース | Firestore (Native mode, asia-northeast1) |
| 認証 | Firebase Auth — Anonymous Auth (将来 Google SSO に移行予定) |
| Functions | Cloud Functions 2nd gen (asia-northeast1) |
| スケジューラ | Cloud Scheduler (毎日 10:00 JST) |
| エミュレーター | Auth:9099, Firestore:8080, UI:4000 |

### 3.4 開発ツール

| 項目 | 内容 |
|------|------|
| DevContainer | Debian GNU/Linux 13 (trixie) |
| モノレポ管理 | **npm workspaces** (`packages/shared/` で Zod スキーマ共有) |
| CI/CD | GitHub Actions |
| リリース | GitHub Release (APK) |
| 定数管理 | backend / frontend 各定数ファイル + ルート共通変数(.env) |

---

## 4. 認証設計

### 4.1 認証方式

| 項目 | 現状 (Phase 1) | 将来計画 |
|------|-----|-----|
| 方式 | Firebase Anonymous Auth | Firebase Auth + Google SSO |
| ライブラリ | firebase/auth `signInAnonymously` | react-native-credentials-manager (将来導入) |
| 将来拡張 | — | Apple ID SSO (iOS テスト環境確保後) |

### 4.2 認証フロー (現状: Anonymous Auth)

```
アプリ起動
  │
  ├─ 未認証 → signInAnonymously() (自動)
  │
  └─ 認証済み → メイン画面へ
```

> **Note**: Google SSO への移行は将来フェーズで実施予定。設計上は `request.auth != null` でルールを統一しているため、認証方式の切り替えは後方互換。

### 4.3 Firestore セキュリティルール (更新)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /programs/{programId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /episodes/{episodeId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/{subcol=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 5. ナビゲーション構成 (更新)

```
Drawer Navigator (Root)
  ├─ Global AudioPlayerBar (認証済み時に常時表示)
  │
  └─ Stack Navigator
       ├─ / (index)              → 番組一覧
       ├─ /program/[id]          → エピソード一覧
       ├─ /episode/[id]/         → Episode (TabBar + PagerView スワイプ)
       │     ├─ index            → エピソードメニュー
       │     ├─ vocabulary       → 語彙表示 (ブックマーク付き)
       │     ├─ transcript       → スクリプト (チャットUI + コンテキストメニュー)
       │     └─ quiz             → クイズ
       ├─ /my-words              → マイ単語帳
       └─ /car-stereo            → カーステモード

Drawer メニュー:
  ├─ 番組一覧 (Firestore から取得)
  ├─ マイ単語帳
  └─ カーステモード
```

エピソード詳細画面のタブ切り替えは `react-native-pager-view` によるスワイプにも対応。

---

## 6. 実装済み機能サマリー (現状)

### 6.1 バックエンド ✅

| 機能 | 状態 |
|------|------|
| スクレイピングエンジン (3番組) | ✅ |
| Cloud Functions (scheduledScraper / manualScraper) | ✅ |
| Firestore 書き込み (programs / episodes) | ✅ |
| 重複チェック | ✅ |

### 6.2 フロントエンド ⚠️

> **注意**: フロントエンドの実装コード (ナビゲーション、画面、音声再生等) が未コミット状態で消失した。
> 以下は消失前の状態を記録したものであり、Phase 1 で再実装が必要。

| 機能 | 状態 |
|------|------|
| 番組一覧・エピソード一覧 (無限スクロール) | ⚠️ 要再実装 |
| エピソード詳細メニュー | ⚠️ 要再実装 |
| 語彙表示 | ⚠️ 要再実装 |
| スクリプト表示 | ⚠️ 型不整合バグ + 要再実装 |
| 音声再生 (再生/一時停止/ループ) | ⚠️ 要再実装 |
| ドロワーナビゲーション | ⚠️ 要再実装 |
| ダーク/ライトテーマ | ⚠️ 要再実装 |
| 匿名認証 | ⚠️ 要再実装 (→ Google SSO に置換予定) |

### 6.3 現存するフロントエンドコード

| ファイル/ディレクトリ | 内容 |
|---------------------|------|
| `app/_layout.tsx` | Root Layout (Expo テンプレート状態) |
| `app/(tabs)/` | Tabs ナビゲーション (テンプレート) |
| `components/` | テーマ対応コンポーネント (themed-text, themed-view 等) |
| `firebaseConfig.ts` | Firebase 設定 + エミュレーター接続 |
| `constants/theme.ts` | カラーテーマ定数 |

---

## 7. 既知の課題・技術的負債

| 課題 | 詳細 | 対応 |
|------|------|------|
| フロントエンド実装消失 | 未コミットの画面・コンポーネントが消失 | Phase 1 で再実装 |
| `transcript.tsx` 型不整合 | DB `ScriptLine[]` vs フロント HTML string | Phase 1 で修正 |
| `import-data.ts` スキーマ不整合 | 旧フィールド名を使用、実質使用不可 | Phase 1 で整理 |
| Anonymous Auth | Google SSO に置換 | Phase 1 |
| Zod 未導入 | 型安全なバリデーションなし | Phase 1 |
| 定数管理が散在 | 定数ファイル未整備 | Phase 1 |

---

## 8. 全機能要件一覧

### 8.1 コンテンツ収集（バックエンド）

| ID | 機能 | 状態 | Phase |
|----|------|------|-------|
| B-1 | 番組インデックスページスクレイピング | ✅ | — |
| B-2 | エピソード詳細スクレイピング | ✅ | — |
| B-3 | クイズデータ取得 (Riddle.com) | ✅ | — |
| B-4 | Firestore 保存・重複チェック | ✅ | — |
| B-5 | Cloud Scheduler 自動実行 | ✅ | — |
| B-6 | HTTP 手動実行エンドポイント | ✅ | — |
| B-7 | Zod バリデーション導入 | ❌ | 1 |
| B-8 | 定数ファイル整備 | ❌ | 1 |

### 8.2 認証

| ID | 機能 | 状態 | Phase |
|----|------|------|-------|
| A-1 | Google SSO (react-native-credentials-manager) | ❌ | 1 |
| A-2 | Firebase Auth Admin SDK 連携 | ❌ | 1 |
| A-3 | Apple ID SSO (将来対応) | ❌ | 将来 |

### 8.3 学習機能（フロントエンド）

| ID | 機能 | 状態 | Phase |
|----|------|------|-------|
| F-1 | 番組一覧 (エピソードプレビュー付き) | ⚠️ 要再実装 | 1 |
| F-2 | エピソード一覧 (無限スクロール) | ⚠️ 要再実装 | 1 |
| F-3 | エピソード詳細メニュー | ⚠️ 要再実装 | 1 |
| F-4 | 語彙リスト表示 | ⚠️ 要再実装 | 1 |
| F-5 | スクリプト表示 — **チャット UI (吹き出し)** | ❌ | 2 |
| F-6 | 音声再生・一時停止・ループ | ⚠️ 要再実装 | 1 |
| F-7 | バックグラウンド再生 | ⚠️ 要再実装 | 1 |
| F-8 | シークバー (スライダー) | ❌ | 2 |
| F-9 | 再生速度変更 (0.8x〜1.5x) | ❌ | 2 |
| F-10 | クイズ機能 (4択) | ❌ | 2 |
| F-11 | PagerView (タブスワイプ切替) | ❌ | 2 |
| F-12 | スクリプト文字列選択 + コンテキストメニュー | ❌ | 3 |
| F-13 | 単語帳へのコンテキストメニュー登録 | ❌ | 3 |
| F-14 | マイ単語帳画面 (手動登録 + 閲覧) | ❌ | 3 |
| F-15 | 再生済みマーク | ❌ | 3 |
| F-16 | 再生位置の記憶・復元 | ❌ | 3 |
| F-17 | 音声ダウンロード | ❌ | 4 |
| F-18 | カーステモード (プレイリスト・ループ再生) | ❌ | 4 |
| F-19 | カーステモード — フィルタ・並び替え・プリセット | ❌ | 4 |

### 8.4 ユーザーアクション集計

| ID | 機能 | 状態 | Phase |
|----|------|------|-------|
| U-1 | エピソード別メトリクス (再生数・DL・クイズ正答) を episodeProgress に記録 | ❌ | 3 |
| U-2 | クライアント側で集計値を算出 (総再生数・DL数・正答率・単語登録数) | ❌ | 3 |

### 8.5 インフラ・CI/CD

| ID | 機能 | 状態 | Phase |
|----|------|------|-------|
| I-1 | CI (ビルド + lint + テスト on develop) | ❌ | 1 |
| I-2 | CD — Backend: Firebase Functions デプロイ (on main) | ❌ | 1 |
| I-3 | CD — Frontend: APK ビルド + GitHub Release 更新 (on main) | ❌ | 5 |
| I-4 | npm workspaces + packages/shared 導入 | ❌ | 1 |
| I-5 | 共通変数管理 (ルート .env → 各アプリに注入) | ❌ | 1 |

---

## 9. 実装フェーズ計画

### Phase 0 — 設計・基盤整備

**目標**: 開発基盤を整え、以降のフェーズをスムーズに進める

| タスク | 内容 |
|--------|------|
| 基本設計書 v2 策定 | ✅ 本ファイル |
| ADR 作成 (Java / Turborepo) | ✅ ADR-001: Java 維持 / ADR-002: npm workspaces 採用 |
| copilot-instructions.md 作成 | 開発ワークフロー定義 |
| copilot-summary.md 作成 | フェーズ開始時の読み込みサマリー |
| 定数ファイル設計 | backend・frontend 各定数 + ルート共通変数方式の決定 |

---

### Phase 1 — バグ修正・認証変更・基盤導入 + フロントエンド再実装

**目標**: 消失したフロントエンド実装を再構築し、Google SSO 認証に切り替え、Zod・定数管理・CI を導入する

| ID | タスク | 対象 |
|----|--------|------|
| 1-1 | フロントエンド再実装 (ナビゲーション) | Drawer + Stack ナビゲーション構築 |
| 1-2 | フロントエンド再実装 (画面) | 番組一覧・エピソード一覧・詳細画面 |
| 1-3 | フロントエンド再実装 (音声再生) | AudioPlayerBar + AudioContext + PlaybackService |
| 1-4 | transcript バグ修正 | `ScriptLine[]` をリスト表示に修正 |
| 1-5 | import-data.ts 整理 | 削除 or 現スキーマに修正 |
| 1-6 | Google SSO 認証導入 | firebase/auth + react-native-credentials-manager |
| 1-7 | Anonymous Auth 削除 | `_layout.tsx` の signInAnonymously を SSO に置換 |
| 1-8 | Zod 導入 (backend) | スクレイパー出力の型バリデーション |
| 1-9 | Zod 導入 (frontend) | Firestore 取得データのバリデーション |
| 1-10 | 定数ファイル作成 | backend/src/constants.ts, frontend/constants/ |
| 1-11 | ルート共通変数管理方式決定 | ルート .env + CI 注入方式の設計 |
| 1-12 | CI パイプライン構築 | GitHub Actions — lint + build + test on develop |
| 1-13 | CD パイプライン構築 (backend) | Firebase Functions デプロイ on main |
| 1-14 | Firestore ルール更新 | users コレクション + Google SSO 対応 |

**受け入れ基準**:
- 番組一覧・エピソード一覧・詳細画面が動作する
- 音声再生が動作する
- スクリプト画面が正常表示される
- Google SSO でログインでき、Firestore にアクセスできる
- Zod バリデーションがバックエンド/フロントエンドで動作する
- develop ブランチ push で CI が実行される
- main ブランチ push で Functions がデプロイされる

---

### Phase 2 — コア学習機能の完成

**目標**: 学習アプリとしてのコア UX を確立する

| ID | タスク | 対象 |
|----|--------|------|
| 2-1 | シークバー追加 | AudioPlayerBar にスライダー |
| 2-2 | 再生速度変更 | 0.8x / 1.0x / 1.2x / 1.5x |
| 2-3 | クイズ機能 UI 実装 | quiz.tsx — 4択・正誤フィードバック・スコア |
| 2-4 | スクリプト画面 — チャット UI 化 | メインスピーカー左右吹き出し + ゲスト別 View |
| 2-5 | PagerView 導入 | エピソード詳細タブのスワイプ切り替え |

**スクリプト画面チャット UI 仕様**:
- 基本は 2 人のメインスピーカーが会話
- スピーカー A → 画面左の吹き出し、スピーカー B → 画面右の吹き出し
- インタビューなどの第三者 → 吹き出しではないボックス View で表示
- メインスピーカーの判定: `ScriptLine[]` の `speaker` フィールド上位 2 名

**受け入れ基準**:
- シークバー・再生速度が動作
- クイズで正誤フィードバック + スコア表示
- スクリプトがチャット形式で表示される
- タブをスワイプで切り替えられる

---

### Phase 3 — パーソナライズ・ユーザーデータ

**目標**: 学習の継続性をサポートする機能を追加する

| ID | タスク | 対象 |
|----|--------|------|
| 3-1 | users コレクション設計・実装 | Firestore + ルール |
| 3-2 | 再生位置の記憶・復元 | AudioContext + Firestore |
| 3-3 | 再生済みマーク | エピソード一覧にアイコン表示 |
| 3-4 | スクリプト文字列選択 + コンテキストメニュー | 長押し → フローティングメニュー |
| 3-5 | 単語帳へのコンテキストメニュー登録 | 選択文字列 → マイ単語帳に追加 |
| 3-6 | マイ単語帳画面 | 登録一覧・手動追加・ローカル+Firestore 同期 |
| 3-7 | エピソード別メトリクス記録 | episodeProgress に playCount/downloaded/quizAttempts/quizCorrectCount |
| 3-8 | クライアント側集計値算出 | episodeProgress + wordbook から総合メトリクスを算出 |

**単語帳スキーマ**:
```typescript
interface WordEntry {
  word: string;       // 英単語
  partOfSpeech?: string;  // 品詞 (noun, verb, etc.)
  meaning?: string;   // 意味
  context?: string;   // 登録元の文脈 (スクリプトからの場合)
  episodeId?: string; // 登録元エピソード
  createdAt: Timestamp;
}
```

**受け入れ基準**:
- 再生位置がアプリ再起動後に復元される
- スクリプトから長押し → コンテキストメニュー → 単語帳登録が動作
- マイ単語帳画面で登録済み単語が一覧表示される
- ユーザーアクションデータが episodeProgress に記録される

---

### Phase 4 — オフライン / カーステモード

**目標**: オフライン利用とドライブ中の学習をサポートする

| ID | タスク | 対象 |
|----|--------|------|
| 4-1 | 音声ダウンロード機能 | エピソード詳細画面にダウンロードボタン |
| 4-2 | カーステモード画面 | ダウンロード済み音源のリスト表示 + ループ再生 |
| 4-3 | プレイリスト — チェックボックス選択 | 任意の音源を再生対象に含める/除外する |
| 4-4 | プレイリスト — フィルタ | プログラム名・配信日時での絞り込み |
| 4-5 | プレイリスト — 並び替え | ドラッグ＆ドロップで再生順序を変更 |
| 4-6 | プレイリスト — プリセット保存 | カスタムプレイリストをプリセットとして登録 |

**カーステモード仕様**:
- Bluetooth 接続のカーナビでの利用を想定
- 再生開始後は操作不要（自動ループ再生）
- プレイリストのカスタマイズとプリセット保存

**受け入れ基準**:
- 音声がダウンロードされ、オフラインで再生可能
- カーステモードでプレイリストが自動ループ再生される
- フィルタ・並び替え・プリセットが動作する

---

### Phase 5 — リリース自動化

**目標**: CI/CD でフロントエンドのリリースフローを自動化する

| ID | タスク | 対象 |
|----|--------|------|
| 5-1 | CD — APK ビルド + GitHub Release 更新 | main マージ時に自動実行 |
| 5-2 | バージョニング戦略 | セマンティックバージョニング、ルート管理 |

---

## 10. データモデル (全体)

### 10.1 既存コレクション

#### `programs` — 番組情報

| フィールド | 型 | 説明 |
|-----------|-----|------|
| Document ID | `string` | 番組 ID (例: `6-minute-english`) |
| `title` | `string` | 番組表示名 |
| `urlPath` | `string` | BBC 内相対パス |
| `baseUrl` | `string` | BBC ベース URL |
| `updatedAt` | `Timestamp` | 最終更新日時 |

#### `episodes` — エピソードデータ

| フィールド | 型 | 説明 |
|-----------|-----|------|
| Document ID | `string` | `{programId}-{slug}` |
| `programId` | `string` | 親番組 ID |
| `title` | `string` | タイトル |
| `date` | `string` | 公開日 |
| `url` | `string` | BBC ページ URL |
| `mp3Url` | `string` | 音声ファイル URL |
| `script` | `ScriptLine[]` | スクリプト |
| `vocabulary` | `VocabularyItem[]` | 語彙リスト |
| `quizContent` | `QuizQuestion[]` | クイズデータ |
| `updatedAt` | `Timestamp` | 最終更新日時 |

### 10.2 新規コレクション (Phase 3)

#### `users/{uid}` — ユーザー情報

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `createdAt` | `Timestamp` | アカウント作成日時 |
| `lastSeenAt` | `Timestamp` | 最終ログイン日時 |

#### `users/{uid}/episodeProgress/{episodeId}` — 再生履歴 + エピソード別メトリクス

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `playedAt` | `Timestamp` | 最終再生日時 |
| `position` | `number` | 再生位置（秒） |
| `completed` | `boolean` | 完了フラグ |
| `playCount` | `number` | このエピソードの再生回数 |
| `downloaded` | `boolean` | ダウンロード済みフラグ |
| `quizAttempts` | `number` | クイズ回答数 |
| `quizCorrectCount` | `number` | クイズ正答数 |

#### `users/{uid}/wordbook/{wordId}` — マイ単語帳

| フィールド | 型 | 説明 |
|-----------|-----|------|
| `word` | `string` | 英単語 |
| `partOfSpeech` | `string?` | 品詞 |
| `meaning` | `string?` | 意味 |
| `context` | `string?` | 登録元文脈 |
| `episodeId` | `string?` | 登録元エピソード |
| `createdAt` | `Timestamp` | 登録日時 |

#### ユーザーアクション集計 — 設計方針

各エピソードの `episodeProgress` に内訳メトリクス (`playCount`, `downloaded`, `quizAttempts`, `quizCorrectCount`) を保持し、ユーザー全体の集計値はクライアント側で算出する。専用の analytics ドキュメントは作成しない。

単語登録数は `wordbook` サブコレクションのドキュメント数で算出。

---

## 11. 変数・定数管理方針

### 11.1 ディレクトリ構成

```
BBCast/
├── .env                      # ルート共通変数 (バージョン番号等)
├── backend/
│   └── src/
│       └── constants.ts      # バックエンド固有定数
└── frontend/
    └── constants/
        ├── theme.ts          # テーマ定数 (既存)
        └── app.ts            # アプリ固有定数 (新規)
```

### 11.2 ルート共通変数 (検討中)

CI/CD パイプラインでルート `.env` から各アプリ側の `.env` に注入する方式を検討。

---

## 12. テスト計画

### 12.1 テスト方針

| テスト種別 | 頻度 | ツール |
|-----------|------|--------|
| ユニットテスト | **各スプリント** | Jest / Vitest |
| 結合テスト | **毎スプリント** | Jest + Firebase Emulator |
| E2E (手動) | フェーズ完了時 | 実機 (Android) |
| CI 自動テスト | Push/PR 時 | GitHub Actions |

### 12.2 Zod バリデーションテスト

Zod スキーマを定義して、スクレイパー出力と Firestore 取得データの両方をバリデート。テストケースで不正入力に対する挙動を検証。

### 12.3 フェーズ別テスト項目

#### Phase 1

- 番組一覧・エピソード一覧・詳細画面が正常動作
- 音声再生が正常動作
- スクリプト画面が話者別に正常表示される
- Google SSO で認証できる
- Zod バリデーションが動作する
- CI が develop push で走る

#### Phase 2

- シークバー・再生速度が動作する
- クイズの正誤フィードバック + スコア表示
- チャット UI で吹き出し表示される
- PagerView でタブスワイプ動作

#### Phase 3

- 再生位置がアプリ再起動後に復元される
- コンテキストメニューから単語帳登録
- マイ単語帳の CRUD 動作
- アクション集計データの送信

#### Phase 4

- オフライン音声再生
- カーステモードのプレイリスト・ループ再生
- フィルタ・並び替え・プリセット

---

## 13. リリース計画

### 13.1 ビルド・配布方式

| 方式 | 内容 |
|------|------|
| 開発 | EAS Development Build (ローカル確認) |
| 配布 | **GitHub Release** (APK ファイル添付) |
| 将来 | iOS TestFlight (Apple ID SSO 実装後) |

### 13.2 フェーズ別リリース目標

| Phase | 内容 | 配布 |
|-------|------|------|
| 0 | 設計完了 | — |
| 1 | バグ修正 + 認証 + 基盤整備 + フロントエンド再実装 | Development Build |
| 2 | コア学習機能完成 | GitHub Release (Preview) |
| 3 | パーソナライズ機能 | GitHub Release 更新 |
| 4 | オフライン / カーステモード | GitHub Release 更新 |
| 5 | CI/CD 自動化完成 | 自動リリース |

---

## 14. 開発環境

| 項目 | 内容 |
|------|------|
| DevContainer | Debian GNU/Linux 13 (trixie) |
| Java feature | JDK 21 維持 (ADR-001 Accepted) |
| Firebase エミュレーター | `firebase emulators:start` |
| Metro Bundler | `cd frontend && npx expo start --clear --dev-client` |
| Android 接続 | USB + `adb reverse tcp:8081 tcp:8081` |
| ブランチ戦略 | GitHub Flow (main / develop / feature/xxx) |
