# ADR-001: DevContainer の Java feature を維持するか

> **ステータス**: ✅ 承認 (Accepted)  
> **作成日**: 2026-03-19  
> **決定日**: 2026-03-19  
> **関連**: ADR-002 (Turborepo → npm workspaces)

## 背景

現在の `.devcontainer/devcontainer.json` に `ghcr.io/devcontainers/features/java:1` (JDK 21) が含まれている。これは Android APK ビルドに Java/Gradle 環境が必要であるため追加されたものと推測される。

ただし、実際のAPKビルドは EAS Build（Expo のクラウドビルドサービス）で実行する予定であり、DevContainer 内でのローカル APK ビルドは行わない想定。

## 課題

1. **イメージサイズ**: JDK 21 の追加で DevContainer のビルド時間とイメージサイズが大幅に増加する
2. **用途不明確**: EAS Build でクラウドビルドする場合、ローカルに Java は不要
3. **Turborepo との関係**: ADR-002 で Turborepo + GitHub Actions CD による APK ビルドを検討しており、CD 環境には Java が必要だが DevContainer には不要という結論になりうる

## 選択肢

### A: Java feature を削除する

- **メリット**: DevContainer のビルド高速化・イメージ軽量化
- **デメリット**: ローカルでの `npx expo prebuild` + Gradle ビルドが不可になる
- **前提**: APK ビルドは全て EAS Build または GitHub Actions CD で実行する

### B: Java feature を維持する

- **メリット**: ローカルでの APK ビルド・デバッグが可能
- **デメリット**: イメージサイズが大きい、実際に使用頻度が低い
- **前提**: 開発中にローカルビルドが必要なケースがある

### C: Java feature を削除 + Turborepo 導入で CD 側に Java を配置

- **メリット**: DevContainer は軽量、CD 環境で APK ビルド
- **デメリット**: Turborepo 導入のオーバーヘッド
- **前提**: ADR-002 で Turborepo 導入が決定する

## 判断基準

- DevContainer 内で `npx expo prebuild` + `./gradlew assembleRelease` を実行する必要があるか？
- EAS Build の無料枠（30ビルド/月）で足りるか？
- GitHub Actions CD で APK ビルドを行う場合、そちらに Java を配置すれば十分か？

## 決定

**✅ Option B: Java feature を維持する** → **補足 (2026-03-20): Dockerfile 内での直接インストールに変更**

### 決定理由 (オーナー回答 2026-03-19)

- 実機テスト時にローカル APK ビルドを行いたい需要がある（Expo クラウドビルドの回数制限・キュー待ち回避）
- DevContainer でのメモリリーク問題は認識しているが、ローカルビルドの選択肢は残しておきたい
- ホストマシン (Mac) には adb のみインストール済み。Java 等の開発ツールはホストにインストールしたくないため DevContainer で管理する
- ADR-002 で Turborepo は不採用となったため、Option C は該当しない

### 実装変更 (2026-03-20)

1. DevContainer の feature (`ghcr.io/devcontainers/features/java:1`) での Java インストールでは、Dockerfile のビルド時に Java が利用できず、Android SDK の `sdkmanager` が失敗するビルドエラーが発生した。Feature は Dockerfile ビルド**後**に適用されるため、Dockerfile 内で `sdkmanager` を実行する前に Java が存在しない。
   - **対応**: Java (OpenJDK 21) を Dockerfile 内で直接 `apt-get install` し、devcontainer.json の Java feature を削除した。

2. Android NDK は Linux ARM64 ホストをサポートしていない (ツールチェーンが `linux-x86_64` のみ)。Apple Silicon Mac でコンテナを ARM (aarch64) で実行すると、NDK の clang/cmake が全て x86_64 バイナリのため `rosetta error: failed to open elf` でビルド不可能。
   - **対応**: Dockerfile に `FROM --platform=linux/amd64` を追加し、コンテナ全体を x86_64 モードで実行 (Apple Silicon では Rosetta 経由)。

### 影響

- `.devcontainer/Dockerfile` で `--platform=linux/amd64` を指定 (Rosetta 必須)
- `.devcontainer/Dockerfile` で `openjdk-21-jdk-headless` を直接インストール
- `.devcontainer/devcontainer.json` から `ghcr.io/devcontainers/features/java:1` を削除
- DevContainer イメージサイズは現状維持（Java 含む）
- Rosetta 翻訳によるオーバーヘッドあり (ビルド時間 体感 20〜30% 増加)
- メモリリーク問題は既知の制約として [docs/troubleshooting.md](../troubleshooting.md) に記録する
