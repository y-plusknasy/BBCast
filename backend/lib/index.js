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
exports.manualScraper = exports.scheduledScraper = void 0;
const functions = __importStar(require("firebase-functions/v1"));
const config_1 = require("./config");
const repository_1 = require("./database/repository");
// Start writing functions
// https://firebase.google.com/docs/functions/typescript
const repository = new repository_1.Repository();
exports.scheduledScraper = functions.pubsub
    .schedule("every 24 hours")
    .timeZone("Asia/Tokyo")
    .onRun(async (context) => {
    console.log("Starting scheduled scraper...");
    await runScraper();
    console.log("Scheduled scraper finished.");
});
// 手動実行用のHTTP関数
exports.manualScraper = functions.https.onRequest(async (request, response) => {
    try {
        await runScraper();
        response.send("Scraping completed successfully.");
    }
    catch (error) {
        console.error("Scraping failed:", error);
        response.status(500).send("Scraping failed.");
    }
});
async function runScraper() {
    for (const programConfig of config_1.config.programs) {
        console.log(`Processing program: ${programConfig.title} (${programConfig.id})`);
        // プログラム情報をDBに保存（更新）
        await repository.saveProgram(programConfig);
        // スクレイパーのインスタンス化
        const ScraperClass = programConfig.scraperClass;
        const scraper = new ScraperClass(config_1.config.bbc.baseUrl);
        // 1. Indexページからエピソード一覧を取得
        const indexUrl = programConfig.urlPath;
        console.log(`Scraping index: ${indexUrl}`);
        const episodes = await scraper.scrapeIndex(indexUrl);
        if (episodes.length === 0) {
            console.log(`No episodes found for ${programConfig.id}`);
            continue;
        }
        // 最新のエピソード（リストの先頭）を取得
        const latestEpisodeSummary = episodes[0];
        console.log(`Latest episode on web: ${latestEpisodeSummary.title} (${latestEpisodeSummary.url})`);
        // 2. DB上の最新エピソードと比較
        const lastSavedEpisode = await repository.getLastEpisode(programConfig.id);
        if (lastSavedEpisode) {
            console.log(`Latest episode in DB: ${lastSavedEpisode.title}`);
            // URLで比較（タイトルは変更される可能性があるため）
            if (lastSavedEpisode.url === latestEpisodeSummary.url) {
                console.log("No new episodes found. Skipping.");
                continue;
            }
        }
        else {
            console.log("No episodes in DB. Fetching latest.");
        }
        // 3. 新しいエピソードの詳細をスクレイピングして保存
        // ここでは最新の1件だけを取得するロジックにしていますが、
        // 必要に応じて「DBにないものを全て取得」するループに変更可能です。
        // 今回は「最新チェック -> 投稿があれば取得」という要件に従い、最新1件を処理します。
        try {
            console.log(`Scraping detail: ${latestEpisodeSummary.url}`);
            const detail = await scraper.scrapeEpisode(latestEpisodeSummary.url);
            await repository.saveEpisode(programConfig.id, detail);
            console.log(`Successfully saved new episode: ${detail.title}`);
        }
        catch (error) {
            console.error(`Failed to scrape episode ${latestEpisodeSummary.url}:`, error);
        }
    }
}
//# sourceMappingURL=index.js.map