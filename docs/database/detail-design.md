# データベース詳細設計書

> **対象**: Firestore (Firebase)  
> **ステータス**: v2 更新 (2026-03-19)  
> **前版**: v1 (2026-03-17)

---

## 1. 概要

Firestore (Native mode, asia-northeast1) を使用。

| データ区分 | 書き込み | 読み取り |
|-----------|---------|---------|
| `programs` / `episodes` | Cloud Functions (Admin SDK) のみ | 認証済みクライアント |
| `users/{uid}` 配下 | 本人 (クライアント SDK) のみ | 本人のみ |

---

## 2. コレクション構成

```
Firestore
├── programs/                         # 番組情報 (既存)
│   ├── 6-minute-english
│   ├── the-english-we-speak
│   └── real-easy-english
├── episodes/                         # エピソードデータ (既存)
│   ├── 6-minute-english-ep-251218
│   └── ...
└── users/{uid}/                      # ユーザーデータ (Phase 3 新規)
    ├── (ルートドキュメント)            # ユーザー情報
    ├── episodeProgress/{episodeId}    # 再生履歴 + エピソード別メトリクス
    └── wordbook/{wordId}             # マイ単語帳
```

---

## 3. `programs` コレクション

### Document ID

番組の識別子（ハイフン区切りのスラッグ）

| ID | 番組名 |
|----|--------|
| `6-minute-english` | 6 Minute English |
| `the-english-we-speak` | The English We Speak |
| `real-easy-english` | Real Easy English |

### フィールド定義

| フィールド名 | 型 | 例 | 説明 |
|-------------|-----|-----|------|
| `title` | `string` | `"6 Minute English"` | 番組表示名 |
| `urlPath` | `string` | `"/learningenglish/english/features/6-minute-english"` | BBC サイト内の相対パス |
| `baseUrl` | `string` | `"https://www.bbc.co.uk"` | BBC ベース URL |
| `updatedAt` | `Timestamp` | — | Cloud Functions による最終更新日時 |

---

## 4. `episodes` コレクション

### Document ID

`{programId}-{episode-slug}` の形式で生成。  
スラッグはエピソード URL の末尾パスセグメントを使用。

例:
- URL: `https://www.bbc.co.uk/.../ep-251218` → ID: `6-minute-english-ep-251218`

### フィールド定義

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| `programId` | `string` | ✅ | 親番組 ID (例: `"6-minute-english"`) |
| `title` | `string` | ✅ | エピソードタイトル |
| `date` | `string` | ✅ | 公開日 (ISO 形式, 例: `"2025-12-18"`) |
| `url` | `string` | ✅ | BBC エピソードページの URL |
| `mp3Url` | `string` | ✅ | 音声ファイルの直接 URL |
| `description` | `string` | — | エピソード説明文 |
| `quizUrl` | `string` | — | Riddle.com クイズページ URL |
| `script` | `ScriptLine[]` | ✅ | スクリプト（話者+テキストの配列） |
| `vocabulary` | `VocabularyItem[]` | ✅ | 語彙リスト（空配列の場合あり） |
| `quizContent` | `QuizQuestion[]` | ✅ | クイズデータ（空配列の場合あり） |
| `updatedAt` | `Timestamp` | ✅ | Cloud Functions による最終更新日時 |

### ネスト型定義

#### ScriptLine

```typescript
{
  speaker: string;  // 話者名 (例: "Neil", "Sam")
  text: string;     // 発話テキスト
}
```

#### VocabularyItem

```typescript
{
  word: string;        // 単語 (例: "resilient")
  definition: string;  // 定義・説明
}
```

#### QuizQuestion

```typescript
{
  question: string;      // 問題文
  options: string[];     // 選択肢の配列
  answerIndex: number;   // 正解の選択肢インデックス (0 始まり)
}
```

### 番組別データ充足状況

| フィールド | 6 Minute English | The English We Speak | Real Easy English |
|-----------|:---:|:---:|:---:|
| `title` | ✅ | ✅ | ✅ |
| `date` | ✅ | ✅ | ✅ |
| `mp3Url` | ✅ | ✅ | ✅ |
| `script` | ✅ | ✅ | ✅ |
| `vocabulary` | ✅ | 空配列 | ✅ |
| `quizContent` | ✅ | 空配列 | 空配列 |
| `description` | ✅ | — | — |
| `quizUrl` | ✅ | — | — |

---

## 5. `users/{uid}` コレクション (Phase 3 新規)

### 5.1 ルートドキュメント — ユーザー情報

| フィールド名 | 型 | 説明 |
|-------------|-----|------|
| `createdAt` | `Timestamp` | アカウント作成日時 |
| `lastSeenAt` | `Timestamp` | 最終ログイン日時 |

### 5.2 `users/{uid}/episodeProgress/{episodeId}` — 再生履歴 + エピソード別メトリクス

Document ID はエピソード ID と同一とする。

| フィールド名 | 型 | 説明 |
|-------------|-----|------|
| `playedAt` | `Timestamp` | 最終再生日時 |
| `position` | `number` | 再生位置（秒） |
| `completed` | `boolean` | 完了フラグ |
| `playCount` | `number` | このエピソードの再生回数 |
| `downloaded` | `boolean` | ダウンロード済みフラグ |
| `quizAttempts` | `number` | クイズ回答数 |
| `quizCorrectCount` | `number` | クイズ正答数 |

### 5.3 `users/{uid}/wordbook/{wordId}` — マイ単語帳

Document ID は自動生成 ID。

| フィールド名 | 型 | 必須 | 説明 |
|-------------|-----|------|------|
| `word` | `string` | ✅ | 英単語 |
| `partOfSpeech` | `string` | — | 品詞 (noun, verb, etc.) |
| `meaning` | `string` | — | 意味 |
| `context` | `string` | — | 登録元の文脈 (スクリプトからの場合) |
| `episodeId` | `string` | — | 登録元エピソード ID |
| `createdAt` | `Timestamp` | ✅ | 登録日時 |

### 5.4 ユーザーアクション集計 — 設計方針

専用の analytics ドキュメントは作成しない。各エピソードの `episodeProgress` に内訳メトリクスを保持し、ユーザー全体の集計値はクライアント側で算出する。

| 集計項目 | 算出方法 |
|---------|--------|
| 総再生数 | 全 `episodeProgress` の `playCount` 合計 |
| ダウンロード数 | `downloaded == true` のドキュメント数 |
| クイズ回答数 | 全 `episodeProgress` の `quizAttempts` 合計 |
| クイズ正答率 | `quizCorrectCount` 合計 / `quizAttempts` 合計 |
| 単語登録数 | `wordbook` サブコレクションのドキュメント数 |

この方式により、「各エピソードの再生回数」などの内訳情報も取得可能となる。

---

## 6. インデックス定義 (`firestore.indexes.json`)

### 複合インデックス

| コレクション | フィールド 1 | 順序 | フィールド 2 | 順序 | 用途 |
|-------------|-------------|------|-------------|------|------|
| `episodes` | `programId` | ASC | `date` | DESC | エピソード一覧取得（番組絞り込み + 日付降順） |
| `users/{uid}/wordbook` | `createdAt` | DESC | — | — | 単語帳の新しい順表示 |

このインデックスはフロントエンドの各画面のクエリに使用される。

---

## 7. セキュリティルール (`firestore.rules`)

```
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

| アクション | コレクション | 条件 |
|-----------|-------------|------|
| Read | `programs`, `episodes` | Firebase Authentication 済み (Google SSO) |
| Write | `programs`, `episodes` | 不可（Admin SDK からのみ） |
| Read / Write | `users/{uid}` 及びサブコレクション | 本人のみ (`request.auth.uid == userId`) |

### 旧ルールとの差異

| 項目 | 旧 (v1) | 新 (v2) |
|------|---------|---------|
| 認証方式 | 匿名認証含む | Google SSO (匿名認証は廃止) |
| `users` コレクション | 未定義 | 本人のみ read/write |
| サブコレクション | 未定義 | ワイルドカードマッチで本人限定 |

---

## 8. Firebase Emulator 設定

| サービス | ポート |
|---------|-------|
| Authentication | 9099 |
| Firestore | 8080 |
| Emulator UI | 4000 |
| Functions | 5001 |

`firebase.json` で `host: "0.0.0.0"` を設定しており、DevContainer 外からのアクセスが可能。

---

## 9. 旧スキーマとの差異

`import-data.ts`（旧設計残存スクリプト）は現在の正式スキーマと異なるフィールド名を使用している。

| 旧フィールド名 (`import-data.ts`) | 現スキーマ (`repository.ts`) |
|--------------------------------|---------------------------|
| `audioUrl` | `mp3Url` |
| `publishedAt` | `date` |
| `sourceUrl` | `url` |

`import-data.ts` は現状では使用不可。正式フローは Cloud Functions 経由のスクレイプのみ。

---

## 10. Zod バリデーション計画 (Phase 1)

Firestore からの取得データ及びスクレイパー出力に Zod スキーマを適用し、型安全なデータアクセスを保証する。

### 対象スキーマ

| スキーマ名 | 対象コレクション | 適用場所 |
|-----------|----------------|---------|
| `ProgramSchema` | `programs` | backend / frontend |
| `EpisodeSchema` | `episodes` | backend / frontend |
| `ScriptLineSchema` | `episodes.script` | backend / frontend |
| `VocabularyItemSchema` | `episodes.vocabulary` | backend / frontend |
| `QuizQuestionSchema` | `episodes.quizContent` | backend / frontend |
| `UserSchema` | `users/{uid}` | frontend (Phase 3) |
| `EpisodeProgressSchema` | `users/{uid}/episodeProgress` | frontend (Phase 3) |
| `WordEntrySchema` | `users/{uid}/wordbook` | frontend (Phase 3) |

npm workspaces の `packages/shared/` に共通スキーマを配置し、backend / frontend で import する。
