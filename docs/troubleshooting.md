# トラブルシューティング (Troubleshooting)

このドキュメントでは、開発中に遭遇した問題とその解決策を記録します。

## 1. Android Development Build のクラッシュ問題

### 問題
Expo Development Build で QR コードを読み取った瞬間にアプリがクラッシュし、「Error loading app, Android internal error」が表示される。

### 原因
react-native-track-player v4.1.2 が React Native の New Architecture (TurboModules) に対応していないため、TurboModule として認識されず、ネイティブモジュールの登録に失敗していた。

### 解決策
1. **react-native-track-player を v5.0.0-alpha0 にアップグレード**
   ```bash
   npm install react-native-track-player@5.0.0-alpha0
   ```

2. **app.json で New Architecture を有効化**
   ```json
   {
     "expo": {
       "plugins": [
         [
           "expo-build-properties",
           {
             "android": {
               "newArchEnabled": true,
               "extraGradleProperties": {
                 "android.useAndroidX": "true",
                 "android.enableJetifier": "true"
               }
             }
           }
         ]
       ]
     }
   }
   ```

3. **Platform.OS チェックを追加**
   - `index.js`: TrackPlayer の登録を Web では実行しない
   ```javascript
   if (Platform.OS !== 'web') {
     TrackPlayer.registerPlaybackService(...);
   }
   ```
   
   - `AudioContext.tsx`: Web 用と Native 用で別々の Provider を実装
   ```typescript
   export const AudioProvider = Platform.OS === 'web' 
     ? WebAudioProvider 
     : NativeAudioProvider;
   ```

4. **Development Build を再ビルド**
   ```bash
   npx expo prebuild --clean
   eas build --profile development --platform android
   ```

## 2. Expo Tunnel 接続の失敗

### 問題
`npx expo start --tunnel` を実行すると、以下のエラーが発生する：
```
Error: Invalid URL generated: https://yosuke_plus_knasy-8081.exp.direct
```

### 原因
ユーザー名に含まれるアンダースコア (`_`) が DNS 標準 (STD 3 - RFC 1035) に違反するため、有効な URL が生成できない。Tunnel URL は `<username>-<port>.exp.direct` の形式で生成されるが、DNS ホスト名にアンダースコアは使用できない。

### 解決策
**USB 接続 + adb reverse を使用**

1. **Android 端末を USB で接続**
   - USB デバッグを有効化

2. **adb でポートフォワーディングを設定**
   ```bash
   adb reverse tcp:8081 tcp:8081
   ```

3. **Metro Bundler を起動（tunnel なし）**
   ```bash
   cd frontend
   npx expo start --clear --dev-client
   ```

4. **Development Build アプリから手動で URL を入力**
   - URL: `http://localhost:8081`

5. **Dev Container の場合**
   - `.devcontainer/devcontainer.json` の `forwardPorts` に `8081` を追加
   ```json
   {
     "forwardPorts": [4000, 8080, 8081, 9099]
   }
   ```

## 3. Firestore Permissions エラー

### 問題
アプリ起動時に「FirebaseError: Missing or insufficient permissions」が表示される。

### 原因
Firestore のセキュリティルールが、匿名認証のユーザーからのアクセスを許可していない。

### 解決策
1. **firestore.rules を更新**
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // ヘルパー関数
       function isAuthenticated() {
         return request.auth != null;
       }
       
       function isAnonymous() {
         return request.auth != null && request.auth.token.firebase.sign_in_provider == 'anonymous';
       }
       
       function isAppClient() {
         return request.auth != null;  // 匿名認証を含むすべての認証済みユーザー
       }
       
       match /programs/{programId} {
         allow read: if isAppClient();
         allow write: if false;  // Admin SDK のみ
       }
       
       match /episodes/{episodeId} {
         allow read: if isAppClient();
         allow write: if false;  // Admin SDK のみ
       }
     }
   }
   ```

2. **ルールをデプロイ**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **フロントエンドで匿名認証を実装**
   - `app/_layout.tsx` で `signInAnonymously(auth)` を実行
   ```typescript
   useEffect(() => {
     const signIn = async () => {
       try {
         await signInAnonymously(auth);
         console.log('Signed in anonymously');
       } catch (error) {
         console.error('Error signing in anonymously:', error);
       }
     };
     signIn();
   }, []);
   ```

## 4. React Hooks の条件付き呼び出しエラー

### 問題
`AudioContext.tsx` で「React Hook must be called in exact same order」エラーが発生する。

### 原因
Platform.OS のチェック内で `useState` や `useEffect` などの Hooks を条件付きで呼び出していたため、レンダリング間で Hooks の順序が変わってしまう。

### 解決策
Web 用と Native 用で完全に別々のコンポーネントを作成し、最上位レベルで Platform.OS チェックを行う。

```typescript
// Web 用 Provider
const WebAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Web 用の実装（ネイティブモジュール不使用）
};

// Native 用 Provider
const NativeAudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ここでネイティブモジュールを require
  const TrackPlayer = require('react-native-track-player').default;
  // Native 用の実装
};

// エクスポート時に Platform.OS で切り替え
export const AudioProvider = Platform.OS === 'web' 
  ? WebAudioProvider 
  : NativeAudioProvider;
```

## 5. 参考リンク

- [React Native New Architecture](https://reactnative.dev/docs/the-new-architecture/landing-page)
- [react-native-track-player v5.0.0 Documentation](https://rntp.dev/docs/next/intro)
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [adb reverse documentation](https://developer.android.com/studio/command-line/adb#forwardports)
