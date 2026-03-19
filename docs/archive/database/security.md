# セキュリティ設計とFirestoreルール (Security Design & Firestore Rules)

## 1. 基本方針 (General Policy)

本プロジェクトでは、データの整合性とセキュリティを確保するため、以下の原則に基づいてアクセス制御を行います。

*   **読み取り (Read)**:
    *   コンテンツデータ（番組、エピソード）は、アプリ経由のアクセス（匿名認証済みユーザー）に対して許可します。
*   **書き込み (Write)**:
    *   コンテンツデータの追加・更新は、信頼されたバックエンド環境（Cloud Functions / Admin SDK）からのみ行い、クライアントアプリからの直接書き込みは一切禁止します。

## 2. Firestoreセキュリティルール定義 (Rule Definitions)

以下は `firestore.rules` に適用する具体的なルール定義です。

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ヘルパー関数: ユーザーが認証済みかどうか
    function isAuthenticated() {
      return request.auth != null;
    }

    // =========================================================
    // 1. コンテンツデータ (Programs & Episodes)
    // =========================================================
    
    // 番組情報 (programs)
    // - Read: 認証済みユーザーなら誰でも可
    // - Write: クライアントからは不可 (Admin SDKのみ)
    match /programs/{programId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }

    // エピソード情報 (episodes)
    // - Read: 認証済みユーザーなら誰でも可
    // - Write: クライアントからは不可 (Admin SDKのみ)
    match /episodes/{episodeId} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
  }
}
```

## 3. 補足事項

*   **Admin SDKの特権**: Cloud Functionsで使用している `firebase-admin` SDKは、上記のセキュリティルールをバイパスして読み書きを行うことができます。そのため、スクレイピング結果の保存処理には影響しません。
*   **開発中の暫定対応**: フロントエンドで匿名認証の実装が完了するまでの間は、一時的に `isAuthenticated()` のチェックを外し、`allow read: if true;` とすることで開発をスムーズに進めることが可能です（本番運用前には必ず戻します）。
