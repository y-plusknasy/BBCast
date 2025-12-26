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
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// エミュレータ環境変数が設定されていない場合、デフォルトを設定
// これにより、スクリプト実行時に自動的にローカルエミュレータに接続されます
if (!process.env.FIRESTORE_EMULATOR_HOST) {
    process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
}
if (!process.env.GCLOUD_PROJECT) {
    process.env.GCLOUD_PROJECT = 'bbcast-backend';
}
// Firebase Admin SDKの初期化
admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT
});
const db = admin.firestore();
async function importData() {
    const jsonPath = path.join(__dirname, '../result.json');
    if (!fs.existsSync(jsonPath)) {
        console.error('Error: result.json not found.');
        return;
    }
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const episodes = JSON.parse(rawData);
    console.log(`Found ${episodes.length} episodes to import.`);
    // Firestoreのバッチ書き込みは一度に500件まで
    const BATCH_SIZE = 400;
    let batch = db.batch();
    let operationCount = 0;
    let totalImported = 0;
    for (const ep of episodes) {
        // ID生成: "Episode 251218 / 18 Dec 2025" -> "251218"
        // マッチしない場合はURLの末尾などを使用
        let id = '';
        const idMatch = ep.date ? ep.date.match(/Episode (\d+)/) : null;
        if (idMatch) {
            id = idMatch[1];
        }
        else {
            // フォールバック: URLからID抽出
            const urlParts = ep.url.split('/');
            id = urlParts[urlParts.length - 1];
        }
        // 日付パース: "Episode 251218 / 18 Dec 2025" -> "18 Dec 2025"
        let publishedAt = new Date();
        if (ep.date && ep.date.includes('/')) {
            const dateStr = ep.date.split('/')[1].trim();
            publishedAt = new Date(dateStr);
        }
        const docRef = db.collection('episodes').doc(id);
        const data = {
            id: id,
            programTitle: "6 Minute English", // 将来的に他の番組が増えた場合用
            title: ep.title || "No Title",
            publishedAt: publishedAt,
            audioUrl: ep.mp3Url || "",
            sourceUrl: ep.url || "",
            script: ep.script || [],
            vocabulary: ep.vocabulary || [],
            quiz: ep.quizContent || [],
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        batch.set(docRef, data);
        operationCount++;
        totalImported++;
        if (operationCount >= BATCH_SIZE) {
            await batch.commit();
            console.log(`Committed batch of ${operationCount} episodes...`);
            batch = db.batch();
            operationCount = 0;
        }
    }
    if (operationCount > 0) {
        await batch.commit();
        console.log(`Committed final batch of ${operationCount} episodes.`);
    }
    console.log(`Successfully imported ${totalImported} episodes into 'episodes' collection.`);
}
importData().catch(console.error);
//# sourceMappingURL=import-data.js.map