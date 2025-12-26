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
const SixMinuteEnglishScraper_1 = require("./scraper/SixMinuteEnglishScraper");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function main() {
    console.log('Starting scraper...');
    const scraper = new SixMinuteEnglishScraper_1.SixMinuteEnglishScraper();
    // 1. Index Page Scraping
    const indexUrl = '/learningenglish/english/features/6-minute-english';
    console.log(`Scraping index: ${indexUrl}`);
    const episodes = await scraper.scrapeIndex(indexUrl);
    console.log(`Found ${episodes.length} episodes.`);
    // 2. Detail Page Scraping (Top 3 only for testing)
    const results = [];
    const targetEpisodes = episodes.slice(0, 3);
    for (const ep of targetEpisodes) {
        console.log(`Scraping detail: ${ep.title} (${ep.url})`);
        try {
            const detail = await scraper.scrapeEpisode(ep.url);
            results.push(detail);
            // サーバー負荷軽減のため少し待機
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        catch (error) {
            console.error(`Failed to scrape ${ep.url}:`, error);
            results.push({ error: `Failed to scrape: ${ep.url}`, summary: ep });
        }
    }
    // 3. Output to JSON
    const outputPath = path.join(__dirname, '../result.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`\nScraping completed. Results saved to: ${outputPath}`);
}
main().catch(console.error);
//# sourceMappingURL=run-scraper.js.map