# DevContainer 再ビルド手順 — Android SDK 追加

> **作成日**: 2026-07-17
> **対象 ADR**: ADR-003 (react-native-track-player 移行)

---

## 目的

`react-native-track-player` を使うローカル Development Build に必要な Android SDK を DevContainer に追加するため、コンテナを再ビルドする。

## 変更点

| ファイル | 変更内容 |
|----------|----------|
| `.devcontainer/Dockerfile` | Android SDK (cmdline-tools, platform-tools, build-tools 35.0.0, platforms android-35) を追加 |
| `.devcontainer/devcontainer.json` | `containerEnv` に `ANDROID_HOME` 追加、ポート 8081 (Metro) 追加 |

---

## 手順

### 1. コンテナ再ビルド

VS Code のコマンドパレット (`Ctrl+Shift+P`) で:

```
Dev Containers: Rebuild Container
```

> **注意**: Android SDK のダウンロードが含まれるため、初回ビルドには時間がかかります (10〜15 分程度)。

### 2. ビルド完了後の確認

コンテナ内のターミナルで以下を確認:

```bash
# Android SDK が認識されていること
echo $ANDROID_HOME
# → /opt/android-sdk

# sdkmanager が使えること
sdkmanager --list_installed

# Java が使えること (Gradle ビルドに必要)
java -version
# → openjdk 21.x
```

### 3. フロントエンドの Development Build

```bash
cd frontend

# ネイティブプロジェクト生成 (Continuous Native Generation)
npx expo prebuild --platform android

# Android ビルド (USB 接続した実機にインストール)
npx expo run:android
```

> **注意**: エミュレータは DevContainer 内では利用できません。USB 接続した Android 実機が必要です。
> 実機の USB デバッグを有効にし、ホスト PC 経由でコンテナにパススルーしてください。

---

## トラブルシューティング

### `sdkmanager: command not found`

コンテナの PATH に `$ANDROID_HOME/cmdline-tools/latest/bin` が含まれていない。
`devcontainer.json` の `containerEnv` に `ANDROID_HOME` が設定されているか確認。

### Gradle ビルドで NDK エラー

一部のネイティブモジュールが NDK を要求する場合:

```bash
sdkmanager "ndk;27.1.12349862"
```

### `expo prebuild` でエラー

```bash
# クリーンに再生成
npx expo prebuild --clean --platform android
```

### USB デバイスがコンテナから見えない

DevContainer に USB デバイスをパススルーする必要があります。
`devcontainer.json` に以下を追加:

```json
"runArgs": ["--device=/dev/bus/usb"]
```

または、ホスト PC 側で `adb` を起動し、コンテナからネットワーク経由で接続:

```bash
# ホスト PC 側
adb tcpip 5555

# コンテナ側
adb connect host.docker.internal:5555
```
