# ADR-002: Turborepo の導入

> **ステータス**: ✅ 承認 (Accepted — Option B: npm workspaces)  
> **作成日**: 2026-03-19  
> **決定日**: 2026-03-19  
> **関連**: ADR-001 (Java feature)

## 背景

本プロジェクトは技術ポートフォリオとしての性格を持ち、著作権の関係上アプリの一般配信は行わない。ソースコードは GitHub で公開し、APK は GitHub Release で限定配布する。

CI/CD パイプラインに載せる際、Expo クラウドビルド (EAS Build) を毎回実施するとビルド回数制限に抵触するリスクがある。

## 課題

1. **EAS Build の回数制限**: 無料枠は月 30 ビルドまで。CI で毎回ビルドすると消費が速い
2. **ビルド最適化**: 変更のあったパッケージのみビルドし、不要なビルドを抑制したい
3. **モノレポ管理**: backend / frontend が独立した package.json を持つが、共通の型定義や定数を共有する需要がある
4. **共通変数の管理**: バージョン番号やフロント/バック共通変数をルートで一元管理したい

## 選択肢

### A: Turborepo を導入する

- **メリット**:
  - キャッシュにより変更のないパッケージのビルドをスキップ
  - ルートの `turbo.json` でビルド依存関係を宣言的に管理
  - 共有パッケージ (`packages/shared`) で型定義・定数を共有可能
  - GitHub Actions との統合が容易 (Remote Cache)
- **デメリット**:
  - 導入のオーバーヘッド（ディレクトリ構成の変更、package.json の再構成）
  - Expo + Turborepo の組み合わせに関する情報が限定的
  - 小規模プロジェクトでは恩恵が小さい可能性

**構成案**:
```
BBCast/
├── turbo.json
├── packages/
│   ├── shared/          # 共通型定義、定数、Zod スキーマ
│   │   ├── package.json
│   │   └── src/
│   ├── backend/         # Cloud Functions (現 backend/)
│   │   └── package.json
│   └── frontend/        # Expo App (現 frontend/)
│       └── package.json
└── package.json         # ルート (workspaces 定義)
```

### B: Turborepo を導入せず、npm workspaces のみで管理する

- **メリット**: 導入が容易。npm workspaces は npm 標準機能
- **デメリット**: ビルドキャッシュ・最適化の恩恵がない
- **備考**: 共有パッケージの作成は npm workspaces でも可能

### C: 現状維持（backend / frontend を独立管理）

- **メリット**: 変更不要
- **デメリット**: 共通型・定数の共有が困難。CI で毎回全ビルド

## 判断基準

- GitHub Actions CD で APK ビルドを行う場合、ビルドキャッシュのメリットは大きいか？
- 共有パッケージ（Zod スキーマ、型定義）の需要はどの程度あるか？
- プロジェクト規模に対して Turborepo 導入のオーバーヘッドは妥当か？
- ポートフォリオとしての技術アピールになるか？

## 決定

**✅ Option B: npm workspaces のみで管理する（Turborepo 不採用）**

### 決定理由 (オーナー回答 2026-03-19)

- 共有パッケージの需要は Zod スキーマ・型定義が中心で、バックエンド側は UI がなく共有したいものが少ない
- 実質ビルド対象はアプリ（フロントエンド）のみであり、Turborepo のビルドキャッシュの恩恵が限定的
- Remote Cache のコスト問題、リソース分散の懸念
- npm workspaces で共有パッケージの管理は十分可能
- ディレクトリ構成変更は Turborepo が必要な場合のみ許容

### 影響

- ルート `package.json` に npm workspaces を設定し、`packages/shared/` で Zod スキーマ・型定義を共有する
- ディレクトリ構成: `backend/`, `frontend/` は現状維持。`packages/shared/` を新規追加
- `turbo.json` は不要
- CI/CD は npm workspaces のスクリプトで制御

### 実装構成案

```
BBCast/
├── package.json              # ルート (workspaces: ["backend", "frontend", "packages/*"])
├── packages/
│   └── shared/               # 共通 Zod スキーマ、型定義
│       ├── package.json
│       └── src/
├── backend/                  # 現状維持
│   └── package.json
└── frontend/                 # 現状維持
    └── package.json
```
