import { SixMinuteEnglishScraper } from './scraper/SixMinuteEnglishScraper';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('Starting scraper...');
  const scraper = new SixMinuteEnglishScraper();
  
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
    } catch (error) {
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
