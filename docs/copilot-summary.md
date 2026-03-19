# Copilot サマリー — BBCast

> **最終更新**: 2026-03-19 (Phase 0 作成時)

---

## 1. プロジェクト概要

BBC Learning English のコンテンツを自動収集し、英語学習に最適化したモバイルアプリ。
個人の英語学習ツール + 技術ポートフォリオとしての二面性を持つ。

---

## 2. 現在のフェーズ

**Phase 0 — 設計・基盤整備** (進行中)

---

## 3. リポジトリ構成

```
BBCast/
├── .github/copilot-instructions.md   # 開発ワークフロー定義
├── backend/                           # Cloud Functions (Node.js 22 + TypeScript)
│   └── src/
│       ├── index.ts                   # scheduledScraper / manualScraper
│       ├── scrape.ts                  # スクレイプ実行エンジン
│       ├── config.ts                  # リージョン設定
│       ├── database/repository.ts     # Firestore 書き込み
│       └── scraper/                   # スクレイパー群
├── frontend/                          # React Native + Expo SDK 54
│   ├── app/                           # expo-router ページ (テンプレート状態)
│   ├── components/                    # UI コンポーネント (テンプレート)
│   ├── firebaseConfig.ts             # Firebase 設定 + エミュレーター接続
│   └── constants/theme.ts             # テーマ定数
├── docs/                              # 設計ドキュメント
│   ├── basic-design.md                # 基本設計書 v2
│   ├── copilot-summary.md             # 本ファイル
│   ├── backend/detail-design.md       # バックエンド詳細設計 v2
│   ├── frontend/detail-design.md      # フロントエンド詳細設計 v2
│   ├── database/detail-design.md      # データベース詳細設計 v2
│   ├── adr/                           # Architecture Decision Records
│   │   ├── ADR-001-java-in-devcontainer.md  (Accepted: Java 維持)
│   │   └── ADR-002-turborepo.md             (Accepted: npm workspaces)
│   ├── requirements/s00/              # 要件定義
│   └── archive/                       # 旧設計ドキュメント
├── firebase.json                      # Firebase 設定
├── firestore.rules                    # セキュリティルール
└── firestore.indexes.json             # インデックス定義
```

---

## 4. 実装済み機能

### バックエンド (全て実装済み・コミット済み)

- 3 番組のスクレイピング (6 Minute English, The English We Speak, Real Easy English)
- Cloud Functions v2 (scheduledScraper / manualScraper)
- Firestore 書き込み + 重複チェック
- Cloud Scheduler 自動実行 (毎日 10:00 JST)

### フロントエンド

> **⚠️ 注意**: 未コミットのフロントエンド実装コード (ナビゲーション、画面、音声再生等) が消失した。
> 現在は Expo テンプレート状態。Phase 1 で再実装が必要。

| 機能 | 状態 |
|------|------|
| Expo テンプレート (tabs ナビゲーション) | ✅ コミット済み |
| Firebase 設定 + エミュレーター接続 | ✅ コミット済み |
| テーマ対応コンポーネント | ✅ コミット済み |
| 番組一覧・エピソード一覧 | ⚠️ 要再実装 |
| エピソード詳細・音声再生 | ⚠️ 要再実装 |
| ドロワーナビゲーション | ⚠️ 要再実装 |

### インフラ

- Firestore: programs / episodes コレクション
- Firebase Auth: Anonymous Auth (→ Google SSO に変更予定)
- Firebase Emulator Suite 設定済み

---

## 5. 既知の課題・技術的負債

| 課題 | Phase |
|------|-------|
| フロントエンド実装消失 — 未コミットの画面・コンポーネントが消失 | 1 |
| `transcript.tsx` — DB `ScriptLine[]` vs フロント HTML string 型不整合 | 1 |
| `import-data.ts` — 旧フィールド名使用、実質使用不可 | 1 |
| Anonymous Auth → Google SSO への移行が未完了 | 1 |
| Zod バリデーション未導入 | 1 |
| 定数管理が散在、定数ファイル未整備 | 1 |
| CI/CD パイプライン未構築 | 1 |

---

## 6. フェーズ計画概要

| Phase | 内容 | 状態 |
|-------|------|------|
| 0 | 設計・基盤整備 | 🔄 進行中 |
| 1 | フロントエンド再実装 + バグ修正・認証変更・基盤導入 | ❌ |
| 2 | コア学習機能 (シークバー, 再生速度, クイズ, チャットUI, PagerView) | ❌ |
| 3 | パーソナライズ (単語帳, 再生履歴, コンテキストメニュー, アナリティクス) | ❌ |
| 4 | オフライン/カーステモード (ダウンロード, プレイリスト, プリセット) | ❌ |
| 5 | リリース自動化 (CD — APK ビルド + GitHub Release) | ❌ |

詳細は `docs/basic-design.md` のセクション 9 を参照。

---

## 7. ADR 決定事項

| ADR | トピック | ステータス | 決定内容 |
|-----|---------|-----------|--------|
| ADR-001 | DevContainer の Java 21 feature | ✅ Accepted | Java 維持。ローカル APK ビルドの選択肢を残す |
| ADR-002 | Turborepo vs npm workspaces | ✅ Accepted | npm workspaces を採用。Turborepo は不採用 |

---

## 8. 技術スタック

### バックエンド

Node.js 22 / TypeScript 5.9.x / Cloud Functions v2 / axios + cheerio / firebase-admin / Zod (Phase 1 導入)

### フロントエンド

React Native 0.81.x + Expo SDK 54 / TypeScript 5.9.x / expo-router / react-native-track-player v5 alpha / Firebase JS SDK v12 / Zod (Phase 1 導入) / react-native-pager-view (Phase 2) / react-native-credentials-manager (Phase 1)

### 認証

Firebase Auth — Anonymous Auth → **Google SSO** (Phase 1 で移行)

---

## 9. 変更履歴

| 日付 | 内容 |
|------|------|
| 2026-03-19 | Phase 0 開始。基本設計書 v2 策定。ADR-001, ADR-002 作成。詳細設計書 v2 更新。copilot-instructions.md, copilot-summary.md 作成。 |
| 2026-03-19 | ADR-001 Accepted (Java 維持)、ADR-002 Accepted (npm workspaces 採用, Turborepo 不採用)。アナリティクス設計を episodeProgress 内訳方式に変更。 |
| 2026-03-19 | フロントエンド実装コード消失を記録。Phase 1 にフロントエンド再実装タスクを追加。ドキュメント全体を再作成。 |
