# ADR-003: 音声再生ライブラリの選定 — expo-av vs react-native-track-player

> **ステータス**: ✅ 承認 (Accepted)  
> **作成日**: 2026-03-20  
> **決定日**: 2026-03-20  
> **関連**: Phase 1 (基本再生), Phase 4 (カーステモード)

---

## コンテキスト

Phase 1 で音声再生を `expo-av` で実装した。これは DevContainer 環境で `react-native-track-player` のネイティブモジュールをビルドできなかったための暫定措置である。

しかし、Phase 4「カーステモード」の要件を満たすには `expo-av` では能力が不足している。

### カーステモード要件

1. **バックグラウンド再生**: 画面 OFF / 他アプリ起動中も再生継続
2. **Bluetooth カーオーディオ連携**: 車のスピーカーから音声出力
3. **車のボタン操作**: ハンドルやカーナビのメディアボタン (次曲/前曲/一時停止) で操作
4. **ロック画面/通知バー**: メディアコントロール表示
5. **プレイリスト管理**: ダウンロード済み音源からプレイリスト作成・編集・保存
6. **プレイリストループ再生**: リスト全体を無限ループ
7. **操作不要**: 一度再生開始したら追加操作なしで継続

---

## 比較表

| 要件 | expo-av | react-native-track-player v5 |
|------|---------|------------------------------|
| バックグラウンド再生 (iOS) | △ `staysActiveInBackground` で一応可能 | ◎ Background Audio Mode |
| バックグラウンド再生 (Android) | **✗** フォアグラウンドサービスなし → OS kill リスク大 | ◎ フォアグラウンドサービス |
| MediaSession 統合 | **✗** 非対応 | ◎ ネイティブ対応 |
| ロック画面コントロール | **✗** 非対応 | ◎ ネイティブ対応 |
| 通知バーコントロール | **✗** 非対応 | ◎ ネイティブ対応 |
| 再生キュー (プレイリスト) | **✗** 自前実装必要 | ◎ ネイティブキュー API |
| キューループ再生 | **✗** 困難 | ◎ `RepeatMode.Queue` |
| Bluetooth 音声出力 | ○ OS レベル | ◎ OS レベル |
| ダウンロードファイル再生 | ○ 可能 | ◎ 可能 |
| シークバー | ○ 可能 | ◎ 可能 |
| 再生速度変更 | ○ `rate` プロパティ | ◎ `rate` プロパティ |
| Expo Go での動作 | ◎ 動作する | **✗** ネイティブモジュール必要 |
| DevContainer での開発 | ◎ ビルド不要 | △ EAS Build / ローカルビルド必要 |

---

## 選択肢

### 案 A: Phase 4 で react-native-track-player に一括移行

- Phase 1〜3: `expo-av` のまま (基本再生のみ)
- Phase 4 開始時に `react-native-track-player v5` に移行
- **メリット**: Phase 1〜3 の開発速度を維持。DevContainer での開発が容易
- **デメリット**: Phase 4 で AudioContext の全面書き換えが必要。Phase 2 のシークバー・再生速度なども再実装

### 案 B: 今 (Phase 1) の時点で react-native-track-player に移行

- 現在の `expo-av` 実装を `react-native-track-player v5` に置き換え
- EAS Build で Development Build を作成し、以降は Expo Go を使わない
- **メリット**: Phase 2〜4 で音声再生の再実装が不要。早期にネイティブ機能を活用可能
- **デメリット**: DevContainer 内で `expo prebuild` + ビルドツールチェーンが必要。CI/CD の変更も必要

### 案 C: Phase 2 で react-native-track-player に移行 (推奨)

- Phase 1: 現状の `expo-av` を維持 (基本再生のみ)
- Phase 2 開始時 (シークバー・再生速度): `react-native-track-player v5` に移行
- **メリット**: Phase 2 のシークバー・再生速度を track-player のネイティブ API で実装可能。Phase 4 では AudioContext の変更が最小限
- **デメリット**: Phase 2 開始時にビルド環境の整備が必要

---

## 補足: ビルド環境について

`react-native-track-player` はネイティブモジュールを含むため、Expo Go では動作しない。以下のいずれかが必要:

1. **EAS Build (推奨)**: `eas build --profile development` で Development Build を作成。DevContainer からリモートビルド可能
2. **ローカルビルド**: DevContainer に Android SDK / Java が既にあるため `npx expo run:android` で可能 (ADR-001 で Java 維持を決定済み)

---

## オーナー判断を求める事項

1. **どの案を採用するか** (A / B / C)
2. **ビルド方法の選択** (EAS Build / ローカルビルド / 両方)

---

## 決定

**✅ 案 B: Phase 1 の時点で react-native-track-player に移行する**

### 決定理由 (オーナー回答 2026-03-20)

- `react-native-track-player` は Phase 4 カーステモードの必須要件 (MediaSession, フォアグラウンドサービス, ネイティブキュー) を満たす唯一のライブラリ
- Phase 2 以降で移行すると、シークバー・再生速度等の音声機能を全て再実装するムダが生じる
- Expo Go でのテスト環境は早期に諦め、ローカル Development Build に移行する
- ビルド & テストが頻発するため、EAS Build (クラウド) ではなくローカルビルド一択
- DevContainer に Android SDK がないため、Dockerfile を変更してコンテナ再ビルドする
- 開発初期段階でビルド環境の方針を確定させた方がよい

### 影響

1. DevContainer の Dockerfile に Android SDK / NDK を追加 → コンテナ再ビルド
2. `expo-av` を削除し `react-native-track-player v5` に置き換え
3. `expo prebuild` で android/ ディレクトリを生成 (Continuous Native Generation)
4. 以降のテストは `npx expo run:android` → 実機/エミュレーターで実行
5. Expo Go は使用しない
