# スクレイピング戦略 (Scraping Strategy)

## 1. 基本方針
BBC Learning Englishのサイト構造に対応するため、スクレイピング処理を3層のクラス構造で実装します。これにより、共通処理の再利用性を高めつつ、番組ごとの特殊な構造にも柔軟に対応します。

## 2. クラス設計 (Class Hierarchy)

### Level 1: `BaseScraper` (基底クラス)
*   **役割**: WebページへのアクセスとHTML解析の共通機能を提供します。
*   **主な機能**:
    *   `constructor(baseUrl)`: ベースURLを受け取り、Axiosインスタンスを初期化します（DIパターン）。
    *   `fetchHtml(url)`: Axiosを使用したHTTPリクエスト（User-Agent設定、タイムアウト処理含む）。
    *   `parseHtml(html)`: Cheerioを使用したDOM解析オブジェクトの生成。

### Level 2: `IndexPageScraper` (目次解析クラス)
*   **継承**: `extends BaseScraper`
*   **役割**: 番組のトップページ（目次）を解析し、エピソードのリストを抽出する共通ロジックを提供します。
*   **主な機能**:
    *   `scrapeIndex(url)`: 目次ページからエピソード概要リスト (`EpisodeSummary[]`) を取得します。
    *   `scrapeEpisode(url)`: **抽象メソッド**。詳細ページの解析ロジックはサブクラスで実装を強制します。
    *   設定ベースの抽出: `IndexPageConfig` (セレクタ定義) を使用してリスト要素を解析します。

### Level 3: `ProgramSpecificScraper` (番組別実装クラス)
*   **継承**: `extends IndexPageScraper`
*   **役割**: 特定の番組（例: "6 Minute English"）に特化した解析ロジックを実装します。
*   **主な機能**:
    *   **詳細ページ解析 (`scrapeEpisode`)**: エピソード詳細ページから、スクリプト、音声URL、語彙リストを抽出する具体的な実装。
    *   **スクリプト構造化**: HTML内の `<p>` タグ構造（`<strong>Speaker</strong> Text`）を解析し、話者とセリフに分離された構造化データ (`ScriptLine[]`) に変換します。
    *   **語彙リスト抽出**: `<br>` タグで区切られたテキストブロックを解析し、単語と定義のペアを抽出します。

## 3. アーキテクチャとデータフロー

### 3.1. 構成要素
*   **Config (`config.ts`)**: プログラムごとの設定（ID, URL, 使用するスクレイパークラス）を定義します。循環参照を避けるため、スクレイパークラスへの依存を持ちますが、スクレイパー側からは参照されません。
*   **Repository (`repository.ts`)**: Firestoreへのデータアクセスを抽象化します。重複チェックやデータの保存処理を担当します。
*   **Controller (`index.ts`)**: Cloud Functionsのエントリーポイント。定期実行や手動トリガーを受け、全体のフローを制御します。

### 3.2. 実行フロー
1.  **Trigger**: Cloud Scheduler (24時間毎) または HTTPリクエストによりプロセスが開始。
2.  **Index Phase**: `config.ts` に定義された各プログラムについて、`IndexPageScraper` が目次ページから最新エピソード一覧を取得。
3.  **Check Phase**: `Repository` を介してDB上の最新エピソードを取得し、Web上の最新エピソードと比較。
    *   新しいエピソードがない場合はスキップ。
4.  **Detail Phase**: 新規エピソードのURLに対して `scrapeEpisode` を実行し、詳細データ（テキスト・音声URL・クイズ等）を抽出。
5.  **Persist Phase**: `Repository` を介して抽出結果をFirestoreの `episodes` コレクションに保存。同時に `programs` コレクションのメタデータも更新。

## 4. 特殊なHTML構造への対応 (Implementation Details)

### 4.1. スクリプトの解析 (Script Parsing)

#### パターンA: 6 Minute English / The English We Speak
これらの番組では、多くの場合、1つの巨大な `<p>` タグの中に複数の話者の発言が詰め込まれています。
```html
<p>
  <strong>Neil</strong><br>Hello...<br>
  <strong>Beth</strong><br>Hi Neil...
</p>
```
これに対応するため、`<p>` タグの `contents()` をノード単位で走査し、以下の条件を満たす `<strong>` (または `<b>`) タグを話者の区切りとして識別します。

*   **条件**: `<strong>` タグの直前および直後が `<br>` タグであること（またはブロックの先頭であること）。

この厳密な判定により、セリフの文中に含まれる強調表示の `<strong>` タグ（例: `This is <strong>important</strong>.`) を誤って話者名として分割してしまうことを防いでいます。

#### パターンB: Real Easy English
この番組では、エピソードによってHTML構造が異なります。

1.  **新形式**: 各話者の発言が個別の `<p>` タグに分かれている。
    ```html
    <p><strong>Neil</strong> Hello...</p>
    <p><strong>Georgie</strong> Hi Neil...</p>
    ```
2.  **旧形式**: パターンAと同様に、1つの `<p>` タグ内に複数の発言が含まれている。

`RealEasyEnglishScraper` では、これら両方に対応するため、以下のロジックを実装しています。
*   `<h3>Transcript</h3>` から次の `<h3>` までの間のすべての `<p>` タグを対象とする。
*   各 `<p>` タグ内の子ノードを走査し、以下のいずれかの条件を満たす `<strong>` タグを話者ラベルとして認識する。
    *   段落の最初の子要素である。
    *   直後に `<br>` タグが存在する。
*   話者ラベルが見つかるたびに、それまでのテキストを前の話者のセリフとして確定させ、新しいセリフの収集を開始する。

### 4.2. 語彙リストの解析 (Vocabulary Parsing)
#### パターンA: 6 Minute English
語彙リストも同様に、1つの `<p>` タグ内に `<br>` で区切られて記述されています。
```html
<p>
  <strong>Word</strong><br>Definition<br>
  <strong>Word2</strong><br>Definition2
</p>
```
これを `<br>` で分割し、`<strong>` タグの有無で単語と定義を判別してペアリングしています。

#### パターンB: Real Easy English
`<h3>Vocabulary</h3>` の後に続く `<p>` タグ群を走査します。
各 `<p>` タグ内に `<strong>` タグが含まれている場合、それを単語とし、残りのテキストを定義として抽出します。

### 4.3. クイズデータの解析 (Quiz Parsing)
BBCのクイズは `riddle.com` という外部サービスを利用して埋め込まれています。
1.  BBCのエピソードページから `iframe` のURLを抽出。
2.  `riddle.com` のページを取得し、埋め込まれているJavaScriptオブジェクト (`window.riddle_view`) を抽出。
3.  Node.jsの `vm` モジュールを使用して安全にオブジェクトをパースし、問題文、選択肢、正解データを構造化データとして取得します。
