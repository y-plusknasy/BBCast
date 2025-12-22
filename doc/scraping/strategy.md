# スクレイピング戦略 (Scraping Strategy)

## 1. 基本方針
BBC Learning Englishのサイト構造に対応するため、スクレイピング処理を3層のクラス構造で実装します。これにより、共通処理の再利用性を高めつつ、番組ごとの特殊な構造にも柔軟に対応します。

## 2. クラス設計 (Class Hierarchy)

### Level 1: `BaseScraper` (基底クラス)
*   **役割**: WebページへのアクセスとHTML解析の共通機能を提供します。
*   **主な機能**:
    *   `fetch(url)`: Axiosを使用したHTTPリクエスト（User-Agent設定、タイムアウト処理含む）。
    *   `parse(html)`: Cheerioを使用したDOM解析オブジェクトの生成。
    *   エラーハンドリング: ネットワークエラーやステータスコードのチェック。

### Level 2: `IndexPageScraper` (目次解析クラス)
*   **継承**: `extends BaseScraper`
*   **役割**: 番組のトップページ（目次）を解析し、エピソードのリストを抽出する共通ロジックを提供します。
*   **主な機能**:
    *   ページネーション対応（必要に応じて）。
    *   リスト要素のループ処理と、各エピソードへのリンク抽出。
    *   更新チェック: 既にDBに存在するエピソードかどうかの判定ロジック（のフック）。

### Level 3: `ProgramSpecificScraper` (番組別実装クラス)
*   **継承**: `extends IndexPageScraper`
*   **役割**: 特定の番組（例: "6 Minute English"）に特化した解析ロジックを実装します。
*   **主な機能**:
    *   **詳細ページ解析**: エピソード詳細ページから、スクリプト、音声URL、語彙リストを抽出する具体的なセレクタ定義。
    *   **スクリプト構造化**: HTML内の `<p>` タグ構造（`<strong>Speaker</strong> Text`）を解析し、話者とセリフに分離された構造化データ (`ScriptLine[]`) に変換します。
    *   **語彙リスト抽出**: `<br>` タグで区切られたテキストブロックを解析し、単語と定義のペアを抽出します。

## 3. データ取得フロー
1.  **Index Phase**: `ProgramSpecificScraper` が目次ページにアクセスし、最新エピソード（Featured）と過去エピソード（List）の両方からURLリストを取得。
2.  **Filter Phase**: 既に取得済みのエピソードを除外（実装予定）。
3.  **Detail Phase**: 新規エピソードのURLに対して詳細ページ解析を実行し、コンテンツ（テキスト・音声URL）を抽出。
4.  **Persist Phase**: 抽出結果をFirestoreに保存（実装予定）。

## 4. 特殊なHTML構造への対応 (Implementation Details)

### 4.1. スクリプトの解析 (Script Parsing)
BBC Learning Englishのスクリプトは、多くの場合、1つの巨大な `<p>` タグの中に複数の話者の発言が詰め込まれています。
```html
<p>
  <strong>Neil</strong><br>Hello...<br>
  <strong>Beth</strong><br>Hi Neil...
</p>
```
これに対応するため、`<p>` タグの `contents()` をノード単位で走査し、以下の条件を満たす `<strong>` (または `<b>`) タグを話者の区切りとして識別します。

*   **条件**: `<strong>` タグの直前および直後が `<br>` タグであること（またはブロックの先頭であること）。

この厳密な判定により、セリフの文中に含まれる強調表示の `<strong>` タグ（例: `This is <strong>important</strong>.`) を誤って話者名として分割してしまうことを防いでいます。

### 4.2. 語彙リストの解析 (Vocabulary Parsing)
語彙リストも同様に、1つの `<p>` タグ内に `<br>` で区切られて記述されています。
```html
<p>
  <strong>Word</strong><br>Definition<br>
  <strong>Word2</strong><br>Definition2
</p>
```
これを `<br>` で分割し、`<strong>` タグの有無で単語と定義を判別してペアリングしています。
