# フロントエンド開発概要 (Frontend Overview)

## 1. アーキテクチャと技術スタック

*   **Framework**: React Native (via [Expo SDK 52])
*   **Language**: TypeScript
*   **Routing**: [Expo Router](https://docs.expo.dev/router/introduction/) (Next.js App Routerライクなファイルベースルーティング)
*   **Backend Integration**: Firebase JS SDK (Firestore)
    *   **現状の方針**: 開発スピード優先のため、ローカルエミュレータではなく**本番環境(Production)のFirestore**に直接接続して開発を行います。
    *   **セキュリティ**: Firestore Rulesにより、クライアントからは`read`のみ許可し、`write`は拒否する設定で安全性を担保します。

## 2. Next.js 開発者のための React Native ガイド

Next.js (React for Web) の知識を React Native にマッピングするためのガイドです。

| 概念 | Next.js (Web) | React Native (Expo) | 備考 |
| :--- | :--- | :--- | :--- |
| **基本タグ** | `<div>`, `<section>` | `<View>` | デフォルトで Flexbox (column) が効いています。スクロールしません。 |
| **テキスト** | `<p>`, `<span>`, `<h1>` | `<Text>` | テキストは必ず `<Text>` で囲む必要があります。 |
| **画像** | `<img>`, `<Image>` | `<Image>` | ローカル画像は `require()`, リモートは `{ uri: ... }` で指定。 |
| **クリックイベント** | `onClick` | `onPress` | `<Button>` や `<Pressable>`, `<TouchableOpacity>` などで使用。 |
| **スクロール** | `overflow: scroll` | `<ScrollView>`, `<FlatList>` | `<View>` はスクロールしません。リスト表示は `<FlatList>` 推奨。 |
| **スタイリング** | CSS, Tailwind, CSS-in-JS | `StyleSheet.create`, Inline Styles | CSSプロパティのサブセット。単位(px)は不要。 |
| **ルーティング** | `app/page.tsx` | `app/index.tsx` | Expo Router もファイルシステムベース。 |
| **リンク** | `<Link href="...">` | `<Link href="...">` | Expo Router の Link コンポーネントを使用。 |
| **ライフサイクル** | `useEffect` | `useEffect` | React Hooks はそのまま使えます。 |

### 主な違いのポイント
*   **Flexbox**: Webのデフォルトは `flex-direction: row` ですが、React Native は `column` です。
*   **スタイルの継承**: Webのように親要素のフォントスタイルなどが子要素に継承されません（Textコンポーネント内を除く）。
*   **HTML要素**: HTMLタグは一切使えません。すべてReact Nativeのコンポーネントに置き換える必要があります。

## 3. サイトマップと画面構成

`frontend/app/` 配下の構成案です。

```
app/
├── _layout.tsx          # ルートレイアウト (Context Provider, Themeなど)
├── (tabs)/              # タブナビゲーション
│   ├── _layout.tsx      # タブ設定
│   ├── index.tsx        # [ホーム] 最新エピソード一覧 (Firestore: `episodes` collection)
│   └── explore.tsx      # [探す] 検索・過去ログ
├── episode/
│   └── [id].tsx         # [詳細] エピソード詳細画面 (音声再生, スクリプト表示)
└── +not-found.tsx       # 404ページ
```

## 4. データフロー

1.  **Fetch**: `useEffect` または React Query を使用して Firestore からデータを取得。
2.  **Store**: 取得したデータはローカルステート (`useState`) に保持。
3.  **Display**: `<FlatList>` でエピソードリストを描画。

### Firestore データ構造 (参照)
*   Collection: `six_minute_english` (v2)
*   Document ID: `programId` (例: `p0jk9c6g`)
*   Fields:
    *   `title`: string
    *   `description`: string
    *   `date`: timestamp
    *   `audioUrl`: string (mp3 URL)
    *   `script`: string (HTML content)
    *   `pdfUrl`: string
    *   `tags`: array

## 5. 今後の開発ステップ

1.  **Firebase Config設定**: 本番環境の認証情報を `firebaseConfig.ts` に設定。
2.  **ホーム画面実装**: Firestoreから最新のエピソードを取得してリスト表示。
3.  **詳細画面実装**: リストタップで遷移し、音声再生とスクリプト表示を行う。
