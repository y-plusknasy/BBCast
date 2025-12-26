"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Repository = void 0;
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
class Repository {
    /**
     * プログラムの最新エピソードを取得する
     * @param programId プログラムID
     */
    async getLastEpisode(programId) {
        const snapshot = await db.collection('episodes')
            .where('programId', '==', programId)
            .orderBy('date', 'desc') // 日付順で降順
            .limit(1)
            .get();
        if (snapshot.empty) {
            return null;
        }
        const data = snapshot.docs[0].data();
        // FirestoreのデータをEpisodeDetail型に変換（必要に応じて）
        return data;
    }
    /**
     * エピソードを保存する
     * @param programId プログラムID
     * @param episode エピソード詳細データ
     */
    async saveEpisode(programId, episode) {
        // URLからスラッグを生成してドキュメントIDにする
        // 例: /features/6-minute-english/ep-231228 -> 6-minute-english-ep-231228
        const slug = episode.url.split('/').pop() || Date.now().toString();
        const docId = `${programId}-${slug}`;
        const docRef = db.collection('episodes').doc(docId);
        await docRef.set(Object.assign(Object.assign({}, episode), { programId, updatedAt: admin.firestore.FieldValue.serverTimestamp() }), { merge: true });
        console.log(`Saved episode: ${docId}`);
    }
    /**
     * プログラム情報を保存/更新する
     */
    async saveProgram(program) {
        await db.collection('programs').doc(program.id).set({
            title: program.title,
            urlPath: program.urlPath,
            baseUrl: 'https://www.bbc.co.uk', // Configから取得すべきだが一旦固定
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    }
}
exports.Repository = Repository;
//# sourceMappingURL=repository.js.map