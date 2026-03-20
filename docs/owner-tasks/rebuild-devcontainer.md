# DevContainer 再ビルド手順 + Android 開発ワークフロー

> **作成日**: 2026-03-20
> **対象 ADR**: ADR-003 (react-native-track-player 移行)

---

## 目的

`react-native-track-player` を使うローカル Development Build に必要な Android SDK を DevContainer に追加するため、コンテナを再ビルドする。

## 変更点

| ファイル | 変更内容 |
|----------|----------|
| `.devcontainer/Dockerfile` | JDK 21 + Android SDK (cmdline-tools, platform-tools, build-tools 35.0.0, platforms android-35) を追加 |
| `.devcontainer/devcontainer.json` | `containerEnv` に `ANDROID_HOME` 追加、ポート 8081 (Metro) 追加、Java feature 削除 |

---

## 1. コンテナ再ビルド

VS Code のコマンドパレット (`Ctrl+Shift+P`) で:

```
Dev Containers: Rebuild Container
```

> **注意**: Android SDK のダウンロードが含まれるため、初回ビルドには時間がかかります (10〜15 分程度)。

### ビルド完了後の確認

コンテナ内のターミナルで以下を確認:

```bash
echo $ANDROID_HOME   # → /opt/android-sdk
java -version         # → openjdk 21.x
sdkmanager --list_installed
```

---

## 2. Android 開発ワークフロー (案 A: ビルドはコンテナ、インストールはホスト)

DevContainer 内に USB デバイスは見えないため、APK ビルドとアプリ実行を分離する。

```
┌─────────────────────────────────┐     ┌───────────────────────────┐
│ DevContainer                    │     │ ホスト PC (Mac)            │
│                                 │     │                           │
│  npm run android:prebuild       │     │                           │
│  npm run android:build          │──→  │  adb install app.apk      │
│  npm run start                  │ ←── │  アプリが Metro に接続     │
│             (Metro :8081)       │     │       (ポート転送済み)     │
└─────────────────────────────────┘     └───────────────────────────┘
```

### 2.1 初回セットアップ (一度だけ)

```bash
# コンテナ内
cd frontend

# ネイティブプロジェクト生成 (Continuous Native Generation)
npm run android:prebuild
# = npx expo prebuild --platform android
```

### 2.2 APK ビルド (コンテナ内)

```bash
cd frontend

# Debug APK をビルド
npm run android:build
# = cd android && ./gradlew assembleDebug

# 出力先: android/app/build/outputs/apk/debug/app-debug.apk
```

### 2.3 実機にインストール (ホスト PC)

```bash
# ホスト PC のターミナル (Mac) で実行
# ※ ホストに adb がインストール済みであること

# DevContainer のワークスペースパスは環境に応じて読み替え
adb install <path-to-workspace>/frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

> **Tip**: VS Code Remote の場合、ワークスペースフォルダはホスト側にもマウントされているため、
> ホストのターミナルから直接 APK ファイルにアクセスできます。

### 2.4 Metro 開発サーバー起動 (コンテナ内)

```bash
cd frontend
npm run start
# Metro が :8081 で起動 (devcontainer.json でポート転送済み)
```

アプリを実機で起動すると、ポート転送経由で Metro に自動接続されます。

### 2.5 日常の開発サイクル

| 操作 | 場所 | コマンド |
|------|------|----------|
| JS/TS コード変更 | コンテナ | — (Metro のホットリロードで即反映) |
| ネイティブ依存追加 | コンテナ | `npm install <pkg>` → `npm run android:prebuild` → `npm run android:build` |
| APK 再インストール | ホスト | `adb install -r <apk>` |
| Metro 起動 | コンテナ | `npm run start` |

> **ポイント**: JS/TS の変更だけなら再ビルド不要。Metro のホットリロードで即座に反映されます。
> ネイティブモジュールの追加・変更があった場合のみ APK の再ビルド + 再インストールが必要です。

---

## 3. npm scripts 一覧

| スクリプト | 説明 |
|-----------|------|
| `npm run android:prebuild` | `expo prebuild --platform android` (android/ 生成) |
| `npm run android:build` | `./gradlew assembleDebug` (Debug APK ビルド) |
| `npm run android:build-release` | `./gradlew assembleRelease` (Release APK ビルド) |
| `npm run start` | Metro 開発サーバー起動 (:8081) |

---

## 4. トラブルシューティング

### `sdkmanager: command not found`

`$ANDROID_HOME` が設定されているか確認: `echo $ANDROID_HOME`

### Gradle ビルドで NDK エラー

```bash
sdkmanager "ndk;27.1.12349862"
```

### `expo prebuild` でエラー

```bash
npx expo prebuild --clean --platform android
```

### Metro に接続できない

1. `devcontainer.json` でポート `8081` が転送されているか確認
2. Metro が起動しているか確認: `npm run start`
3. 実機が同じネットワーク上にあるか確認
4. アプリの開発メニューで Metro のホスト/ポートを手動設定
