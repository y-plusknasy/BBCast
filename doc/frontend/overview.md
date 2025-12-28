# フロントエンド開発概要 (Frontend Overview)

## 1. アーキテクチャと技術スタック

*   **Framework**: React Native (via [Expo SDK 52])
*   **Language**: TypeScript
*   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/)
*   **Backend Integration**: Firebase JS SDK (Firestore)
    *   **Collection**: `episodes` (Field `programId` で番組を識別)
    *   **Auth**: Anonymous Auth (with AsyncStorage persistence)

## 2. 画面遷移と構成 (Navigation Flow)

現在の `(tabs)` レイアウトを廃止し、ドロワー (Drawer) + スタック (Stack) 構成に変更します。

### 階層構造

1.  **Root (Drawer)**
    *   **Program List (Home)**: アプリ起動後のメイン画面。利用可能な番組一覧を表示。
2.  **Stack Navigation**
    *   **Episode List**: 選択した番組のエピソード一覧。
    *   **Episode Topic List**: エピソードの概要とアクションボタン一覧。
    *   **Episode Topic Detail**: 各トピックの詳細画面 (Vocabulary, Transcript, Quiz)。

### サイトマップ案 (`app/` ディレクトリ)

```
app/
├── _layout.tsx             # Root Layout (Drawer + Auth Provider)
├── index.tsx               # [1] Program List (Drawerのメイン画面)
├── program/
│   └── [id].tsx            # [2] Episode List (Stack)
└── episode/
    └── [id]/
        ├── _layout.tsx     # Episode Layout (Audio Player Overlay)
        ├── index.tsx       # [3] Topic List (Title, Date, Buttons)
        ├── vocabulary.tsx  # [4] Vocabulary Detail
        ├── transcript.tsx  # [4] Transcript Detail
        └── quiz.tsx        # [4] Quiz Detail
```

## 3. UI/UX デザイン要件

### ドロワー (Drawer)
*   アプリのメインナビゲーションとして機能。
*   [1] **Program List** を表示（または格納）。

### オーディオプレイヤー (Audio Player)
*   **表示条件**: [3] Topic List および [4] Topic Detail 画面。
*   **位置**: 画面下部（以前のタブバーの位置）。
*   **機能**: 再生/一時停止、シークバー（任意）。
*   **状態**: 音源がダウンロード済み、または再生可能な場合に表示。

### 各画面の詳細

#### [1] Program List
*   Firestoreから利用可能な `programId` のリスト（または定義済みリスト）を表示。
*   タップで [2] Episode List へ遷移。

#### [2] Episode List
*   選択された `programId` に紐づくエピソードを `date` 降順で表示。
*   無限スクロール (Infinite Scroll) またはページネーション。

#### [3] Episode Topic List
*   エピソードのメタデータ（タイトル、日付）を表示。
*   アクションボタン:
    *   Download (音源保存)
    *   Vocabulary (単語帳)
    *   Transcript (スクリプト)
    *   Quiz (クイズ)

#### [4] Episode Topic Detail
*   選択されたトピックのコンテンツを表示。
*   **Vocabulary**: 単語と定義のリスト。
*   **Transcript**: HTMLレンダリングされたスクリプト。
*   **Quiz**: クイズインターフェース。

## 4. データフロー

1.  **Auth**: 匿名認証でログイン。
2.  **Fetch**: Firestore `episodes` コレクションからクエリ。
    *   Query: `where('programId', '==', ID).orderBy('date', 'desc')`
3.  **Store**: React State & Context (Audio Player State).
