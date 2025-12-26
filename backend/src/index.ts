import { onSchedule } from "firebase-functions/v2/scheduler";
import { onRequest } from "firebase-functions/v2/https";
import { config } from "./config";
import { Repository } from "./database/repository";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

const repository = new Repository();

export const scheduledScraper = onSchedule({
  schedule: "every 24 hours",
  timeZone: "Asia/Tokyo",
  region: "asia-northeast1", // 東京リージョンを指定
}, async (event) => {
  console.log("Starting scheduled scraper...");
  await runScraper();
  console.log("Scheduled scraper finished.");
});

// 手動実行用のHTTP関数
export const manualScraper = onRequest({
  region: "asia-northeast1", // 東京リージョンを指定
}, async (request, response) => {
  try {
    await runScraper();
    response.send("Scraping completed successfully.");
  } catch (error) {
    console.error("Scraping failed:", error);
    response.status(500).send("Scraping failed.");
  }
});

async function runScraper() {
  for (const programConfig of config.programs) {
    console.log(`Processing program: ${programConfig.title} (${programConfig.id})`);
    
    // プログラム情報をDBに保存（更新）
    await repository.saveProgram(programConfig);

    // スクレイパーのインスタンス化
    const ScraperClass = programConfig.scraperClass;
    const scraper = new ScraperClass(config.bbc.baseUrl);

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
    } else {
      console.log("No episodes in DB. Fetching latest.");
    }

    // 3. 新しいエピソードの詳細をスクレイピングして保存
    
    try {
      console.log(`Scraping detail: ${latestEpisodeSummary.url}`);
      const detail = await scraper.scrapeEpisode(latestEpisodeSummary.url);
      
      await repository.saveEpisode(programConfig.id, detail);
      console.log(`Successfully saved new episode: ${detail.title}`);
      
    } catch (error) {
      console.error(`Failed to scrape episode ${latestEpisodeSummary.url}:`, error);
    }
  }
}
