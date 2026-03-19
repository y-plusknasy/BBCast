import * as fs from 'fs';
import * as path from 'path';
import { config } from './config';

async function scrapeData() {
  const allEpisodes: any[] = [];

  for (const programConfig of config.programs) {
    console.log(`Scraping ${programConfig.title}...`);
    
    const ScraperClass = programConfig.scraperClass;
    const scraper = new ScraperClass(config.bbc.baseUrl);

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
          
          allEpisodes.push({
            programId: programConfig.id,
            programTitle: programConfig.title,
            ...episodeDetail
          });
          
          console.log(`    ✓ Scraped successfully`);
        } catch (error) {
          console.error(`    ✗ Failed to scrape episode: ${error}`);
        }
      }
    } catch (error) {
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
