"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BaseScraper_1 = require("./scraper/BaseScraper");
const IndexPageScraper_1 = require("./scraper/IndexPageScraper");
class TestScraper extends BaseScraper_1.BaseScraper {
    constructor() {
        super();
    }
    async testIndex(url) {
        console.log(`\n=== Testing Index Page: ${url} ===`);
        // 修正: Featuredな最新エピソードと、通常のリストの両方を拾えるセレクタ
        // .widget-bbcle-coursecontentlist-featured (最新)
        // .widget-progress-enabled li (過去分)
        const config = {
            listSelector: '.widget-bbcle-coursecontentlist-featured, .widget-progress-enabled li',
            urlSelector: 'a',
            titleSelector: 'h2', // h2直下のみを狙う
            dateSelector: '.details h3' // 日付が含まれる箇所
        };
        class ConcreteIndexScraper extends IndexPageScraper_1.IndexPageScraper {
            async scrapeEpisode(url) {
                return {};
            }
        }
        const scraper = new ConcreteIndexScraper('https://example.com', config);
        const episodes = await scraper.scrapeIndex(url);
        console.log(`Found ${episodes.length} episodes.`);
        // 最新のエピソード（Featured）が取れているか確認
        if (episodes.length > 0) {
            console.log('Top item (Featured?):', episodes[0]);
        }
        const targetSlug = 'ep-251218';
        const found = episodes.find(ep => ep.url.includes(targetSlug));
        if (found) {
            console.log(`\n[SUCCESS] Found target episode: ${found.title} (${found.url})`);
        }
        else {
            console.log(`\n[WARNING] Target episode (${targetSlug}) not found.`);
        }
    }
    async testDetail(url) {
        console.log(`\n=== Testing Detail Page: ${url} ===`);
        const $ = await this.fetchAndParse(url);
        // 1. MP3 Download URL (変更なし)
        console.log('\n--- MP3 URL ---');
        const audioLink = $('a[href$=".mp3"]').attr('href');
        console.log(`MP3 Link: ${audioLink}`);
        // 2. Quiz Link (修正)
        console.log('\n--- Quiz Link ---');
        // "Try our free interactive quiz" のリンクを探す
        const quizLink = $('h3:contains("Try our") a').attr('href') || $('a:contains("interactive quiz")').attr('href');
        console.log(`Quiz Link: ${quizLink}`);
        // 3. Vocabulary (修正: 兄弟要素のpタグ内を解析)
        console.log('\n--- Vocabulary ---');
        const vocabHeader = $('h3:contains("Vocabulary")');
        if (vocabHeader.length > 0) {
            const vocabContainer = vocabHeader.next('p');
            const htmlContent = vocabContainer.html() || '';
            // <br>で分割して解析してみる
            const parts = htmlContent.split('<br>').map(s => s.trim()).filter(s => s !== '' && s !== '&nbsp;');
            console.log(`Raw parts count: ${parts.length}`);
            // 簡易的なパース: <strong>Word</strong> と Definition のペアを探す
            parts.forEach((part, i) => {
                // HTMLタグを除去して表示確認
                const text = part.replace(/<[^>]*>/g, '');
                if (i < 6)
                    console.log(`Part [${i}]: ${text}`);
            });
        }
        else {
            console.log('No "Vocabulary" header found.');
        }
        // 4. Transcript (修正: TRANSCRIPTを含む要素の兄弟を探索)
        console.log('\n--- Transcript ---');
        // "TRANSCRIPT" を含む要素を探す (strongタグやpタグ)
        const transcriptLabel = $('strong:contains("TRANSCRIPT"), b:contains("TRANSCRIPT")');
        if (transcriptLabel.length > 0) {
            // その親のpタグを見つける
            let currentElement = transcriptLabel.closest('p');
            console.log('Found Transcript label container.');
            // 次の要素へ
            currentElement = currentElement.next();
            // "Note: This is not a word-for-word..." をスキップするかどうか
            if (currentElement.text().includes('Note:')) {
                currentElement = currentElement.next();
            }
            // 本文を取得 (試しに最初の3パラグラフ)
            let scriptText = '';
            for (let i = 0; i < 3; i++) {
                if (currentElement.length === 0)
                    break;
                // もし次のセクション(h3など)に来たら終了
                if (currentElement.is('h3'))
                    break;
                scriptText += currentElement.text().trim() + '\n';
                currentElement = currentElement.next();
            }
            console.log(`Script Preview:\n${scriptText}`);
        }
        else {
            console.log('No "TRANSCRIPT" label found.');
        }
    }
}
// 実行
const scraper = new TestScraper();
(async () => {
    // 1. Index Page Test
    await scraper.testIndex('https://www.bbc.co.uk/learningenglish/english/features/6-minute-english');
    // 2. Detail Page Test
    await scraper.testDetail('https://www.bbc.co.uk/learningenglish/english/features/6-minute-english_2025/ep-251218');
})();
//# sourceMappingURL=test-scraper.js.map