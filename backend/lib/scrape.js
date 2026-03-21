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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const config_1 = require("./config");
async function scrapeData() {
    const allEpisodes = [];
    for (const programConfig of config_1.config.programs) {
        console.log(`Scraping ${programConfig.title}...`);
        const ScraperClass = programConfig.scraperClass;
        const scraper = new ScraperClass(config_1.config.bbc.baseUrl);
        try {
            // インデックスページからエピソード一覧を取得
            const indexUrl = programConfig.urlPath;
            const episodes = await scraper.scrapeIndex(indexUrl);
            console.log(`Found ${episodes.length} episodes for ${programConfig.title}`);
            // 最新の3エピソードだけ詳細を取得（時間短縮のため）
            const targetEpisodes = episodes.slice(0, 3);
            for (const episodeSummary of targetEpisodes) {
                console.log(`  Scraping: ${episodeSummary.title}`);
                try {
                    const episodeDetail = await scraper.scrapeEpisode(episodeSummary.url);
                    allEpisodes.push(Object.assign({ programId: programConfig.id, programTitle: programConfig.title }, episodeDetail));
                    console.log(`    ✓ Scraped successfully`);
                }
                catch (error) {
                    console.error(`    ✗ Failed to scrape episode: ${error}`);
                }
            }
        }
        catch (error) {
            console.error(`Failed to scrape ${programConfig.title}: ${error}`);
        }
    }
    // result.json に保存
    const outputPath = path.join(__dirname, '../result.json');
    fs.writeFileSync(outputPath, JSON.stringify(allEpisodes, null, 2));
    console.log(`\n✓ Scraped ${allEpisodes.length} episodes in total`);
    console.log(`✓ Saved to ${outputPath}`);
}
scrapeData().catch(console.error);
//# sourceMappingURL=scrape.js.map