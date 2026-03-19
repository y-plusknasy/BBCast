# フロントエンド詳細設計 v2

> **最終更新**: 2026-03-19  
> **対象フェーズ**: Phase 0 (設計・基盤整備) — Phase 1 以降の実装仕様を含む

---

## 1. 概要

React Native + Expo SDK 54 によるモバイルアプリ。BBC Learning English の番組・エピソードを閲覧し、音声再生・クイズ・語彙学習を行う英語学習アプリ。

> **⚠️ 現状**: 未コミットの実装コードが消失し、Expo テンプレート状態。Phase 1 で再実装が必要。

---

## 2. 技術スタック

| 項目 | 技術 | バージョン |
|------|------|------------|
| フレームワーク | React Native | 0.81.x |
| プラットフォーム | Expo SDK | 54 |
| ルーティング | expo-router | 6.x |
| 言語 | TypeScript | 5.9.x |
| DB クライアント | Firebase JS SDK | 12.x |
| 音声再生 | react-native-track-player | v5 alpha (Phase 1 導入) |
| 状態管理 | React Context | — |
| バリデーション | Zod | Phase 1 導入 |
| 認証 | Firebase Auth | Anonymous → Google SSO (Phase 1) |

### Phase 2〜4 追加予定

| 項目 | 技術 | Phase |
|------|------|-------|
| ページスワイプ | react-native-pager-view | 2 |
| 認証マネージャー | react-native-credentials-manager | 1 |

---

## 3. 現在のコミット済みコード

### 3.1 ディレクトリ構成 (現状)

```
frontend/
├── app/
│   ├── _layout.tsx              # Root Layout (Stack + Anonymous Auth)
│   ├── modal.tsx                # モーダル画面
│   └── (tabs)/                  # ボトムタブ (Expo テンプレート)
│       ├── _layout.tsx
│       ├── index.tsx            # Home タブ
│       └── explore.tsx          # Explore タブ
├── components/
│   ├── themed-text.tsx          # テーマ対応 Text
│   ├── themed-view.tsx          # テーマ対応 View
│   ├── haptic-tab.tsx           # ハプティックフィードバック付きタブ
│   ├── external-link.tsx        # 外部リンク
│   ├── hello-wave.tsx           # 挨拶アニメーション
│   ├── parallax-scroll-view.tsx # パララックススクロール
│   └── ui/
│       ├── collapsible.tsx      # 折りたたみ
│       ├── icon-symbol.tsx      # アイコン
│       └── icon-symbol.ios.tsx  # iOS 用アイコン
├── constants/
│   └── theme.ts                 # Colors (light/dark) + Fonts
├── hooks/
│   ├── use-color-scheme.ts
│   ├── use-color-scheme.web.ts
│   └── use-theme-color.ts
├── firebaseConfig.ts            # Firebase 初期化 + Emulator 接続
└── index.js                     # エントリーポイント
```

### 3.2 Root Layout (app/_layout.tsx)

- `Stack` ナビゲーション (`(tabs)` + `modal`)
- Anonymous Auth による自動サインイン (`useEffect`)
- ダークモード対応 (`ThemeProvider`)

### 3.3 Firebase 設定 (firebaseConfig.ts)

- Firebase JS SDK v12 初期化
- `__DEV__` 時に Firebase Emulator (Auth: 9099, Firestore: 8080) に接続

---

## 4. Phase 1 再実装仕様 — ナビゲーション

### 4.1 ナビゲーション構成 (目標)

```
RootLayout (Stack)
├── (stack)/
│   ├── _layout.tsx         # Stack Navigator (ヘッダー設定)
│   ├── index.tsx           # 番組一覧画面
│   ├── program/
│   │   └── [id].tsx        # エピソード一覧画面
│   └── episode/
│       └── [id]/
│           ├── _layout.tsx # エピソード詳細 Layout
│           ├── index.tsx   # エピソード詳細 (メニュー/概要)
│           ├── transcript.tsx    # スクリプト表示
│           ├── vocabulary.tsx    # 語彙表示
│           └── quiz.tsx          # クイズ画面
└── AudioPlayerBar              # 画面下部の音声プレーヤー (オーバーレイ)
```

### 4.2 Drawer ナビゲーション (Phase 2 以降)

- expo-router の Drawer を使用
- サイドメニュー: 番組一覧、単語帳、設定、カーステモード

---

## 5. Phase 1 再実装仕様 — 画面設計

### 5.1 番組一覧画面 (index.tsx)

| 項目 | 仕様 |
|------|------|
| データソース | Firestore `programs` コレクション |
| 表示形式 | FlatList (カード型) |
| カード内容 | サムネイル / 番組名 / 最新エピソード日 |
| タップ動作 | `program/[id]` へナビゲーション |

### 5.2 エピソード一覧画面 (program/[id].tsx)

| 項目 | 仕様 |
|------|------|
| データソース | Firestore `episodes` (programId で filter, date desc) |
| 表示形式 | FlatList (無限スクロール) |
| ページサイズ | 20 件 / ページ |
| カード内容 | タイトル / 日付 / description |
| タップ動作 | `episode/[id]` へナビゲーション |

### 5.3 エピソード詳細 — メニュー (episode/[id]/index.tsx)

| 項目 | 仕様 |
|------|------|
| 表示内容 | タイトル / 日付 / description |
| メニュー項目 | Transcript / Vocabulary / Quiz (存在する場合のみ) |
| 音声再生 | AudioPlayerBar に mp3Url を渡して再生開始 |

### 5.4 トランスクリプト画面 (transcript.tsx)

| 項目 | 仕様 |
|------|------|
| データ形式 | `ScriptLine[]` (speaker + text) |
| 表示形式 | 話者名をラベルとして吹き出し風に表示 |
| 既知の課題 | Phase 0 では DB の `ScriptLine[]` とフロント HTML string の型不整合があった。Zod 導入で解消予定 |

### 5.5 語彙画面 (vocabulary.tsx)

| 項目 | 仕様 |
|------|------|
| データ形式 | `VocabularyItem[]` (word + definition) |
| 表示形式 | Collapsible リスト (タップで定義展開) |

### 5.6 クイズ画面 (quiz.tsx)

| 項目 | 仕様 |
|------|------|
| データ形式 | `QuizQuestion[]` (question + QuizOption[]) |
| 表示形式 | 1 問ずつ表示。選択肢タップで正誤判定 |
| 対象番組 | 6 Minute English のみ |

---

## 6. Phase 1 再実装仕様 — 音声再生

### 6.1 react-native-track-player v5 alpha

| 項目 | 仕様 |
|------|------|
| ライブラリ | react-native-track-player v5 (alpha) |
| サービス | PlaybackService.ts (バックグラウンド再生イベントハンドラー) |
| 初期化 | SetupService.ts (TrackPlayer.setupPlayer) |
| 状態管理 | AudioContext (React Context) |

### 6.2 AudioContext

```typescript
// AudioContext が提供する値
interface AudioContextValue {
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
}
```

### 6.3 AudioPlayerBar コンポーネント

- 画面下部に常時表示されるミニプレーヤー
- 再生中のトラック情報 (タイトル / 番組名)
- 再生 / 一時停止ボタン
- プログレスバー (Phase 2 でシークバー化)

---

## 7. Phase 1 — 認証変更

### 7.1 Google SSO

| 項目 | 仕様 |
|------|------|
| ライブラリ | react-native-credentials-manager |
| フロー | Anonymous Auth → Google SSO にリンク (linkWithCredential) |
| Firebase 設定 | SHA-1 / SHA-256 フィンガープリントの登録が必要 |
| 画面 | 設定画面またはドロワーメニューに Google ログインボタン |

### 7.2 匿名認証の維持

- 初回起動時は引き続き Anonymous Auth で自動サインイン
- Google SSO は任意（ログインしなくてもアプリの基本機能は利用可能）
- Google SSO でログインすると `episodeProgress` 等のユーザーデータが紐づく

---

## 8. Phase 2〜4 の主要機能 (参考)

| Phase | 機能 | 概要 |
|-------|------|------|
| 2 | PagerView | `episode/[id]/` 配下の画面をスワイプで切り替え |
| 2 | シークバー | AudioPlayerBar にシーク機能追加 |
| 2 | 再生速度変更 | 0.5x〜2.0x |
| 2 | チャット UI | エピソードの質疑応答 (外部 LLM API 連携) |
| 3 | 単語帳 | Firestore `users/{uid}/wordbook` でブックマーク管理 |
| 3 | 再生履歴 | `episodeProgress` に記録 |
| 3 | コンテキストメニュー | 長押しで単語をコンテキストメニューに表示 |
| 4 | オフラインダウンロード | MP3 ファイルのローカル保存 |
| 4 | カーステモード | 大型ボタン UI / 音声操作 |
| 4 | プレイリスト | 番組横断の順序再生 |

---

## 9. テスト方針

### 9.1 Phase 1

- **ユニットテスト**: コンポーネント単体テスト (React Native Testing Library)
- **結合テスト**: Firebase Emulator を使用した Firestore データ取得テスト
- **手動 E2E**: 実機 (Android) でのナビゲーション・音声再生確認

### 9.2 テスト環境

- Firebase Emulator Suite (Auth:9099, Firestore:8080, Functions:5001, UI:4000)
- `firebaseConfig.ts` で `__DEV__` 時に自動接続
