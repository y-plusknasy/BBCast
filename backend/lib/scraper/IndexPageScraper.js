"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IndexPageScraper = void 0;
const BaseScraper_1 = require("./BaseScraper");
/**
 * IndexPageScraper
 *
 * 番組の目次ページ（Index Page）を解析するための基底クラス。
 * 具体的なセレクタはコンストラクタまたは設定で受け取る。
 */
class IndexPageScraper extends BaseScraper_1.BaseScraper {
    constructor(baseUrl, config) {
        super(baseUrl);
        this.config = config;
    }
    /**
     * 目次ページをスクレイピングし、エピソードのリストを返す
     * @param url 目次ページのURL（相対パス可）
     * @returns エピソード概要のリスト
     */
    async scrapeIndex(url) {
        const $ = await this.fetchAndParse(url);
        return this.extractEpisodes($);
    }
    /**
     * Cheerioオブジェクトからエピソード情報を抽出する
     */
    extractEpisodes($) {
        const episodes = [];
        const { listSelector, urlSelector, titleSelector, dateSelector, descriptionSelector } = this.config;
        $(listSelector).each((_, element) => {
            const el = $(element);
            // URLの抽出と正規化
            let episodeUrl = el.find(urlSelector).attr('href');
            if (!episodeUrl)
                return; // URLがない場合はスキップ
            // 相対パスなら絶対パスに変換
            if (episodeUrl.startsWith('/')) {
                episodeUrl = `${this.baseUrl}${episodeUrl}`;
            }
            // タイトルの抽出
            const title = this.cleanText(el.find(titleSelector).text());
            const summary = {
                title,
                url: episodeUrl,
            };
            // 日付の抽出（任意）
            if (dateSelector) {
                summary.date = this.cleanText(el.find(dateSelector).text());
            }
            // 概要の抽出（任意）
            if (descriptionSelector) {
                summary.description = this.cleanText(el.find(descriptionSelector).text());
            }
            episodes.push(summary);
        });
        return episodes;
    }
}
exports.IndexPageScraper = IndexPageScraper;
//# sourceMappingURL=IndexPageScraper.js.map