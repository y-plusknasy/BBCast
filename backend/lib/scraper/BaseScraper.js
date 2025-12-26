"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseScraper = void 0;
const axios_1 = __importDefault(require("axios"));
const cheerio_1 = require("cheerio");
/**
 * BaseScraper
 *
 * Webスクレイピングの基底クラス。
 * HTTPリクエストの送信とHTMLパースの共通機能を提供する。
 */
class BaseScraper {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
        const config = {
            timeout: 10000, // 10秒タイムアウト
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; BBCast/1.0; +https://github.com/y-plusknasy/BBCast)',
            },
        };
        if (baseUrl) {
            config.baseURL = baseUrl;
        }
        this.axiosInstance = axios_1.default.create(config);
    }
    /**
     * 指定されたURLからHTMLを取得する
     * @param url 取得対象のURL（baseURLが設定されている場合は相対パス可）
     * @returns HTML文字列
     */
    async fetchHtml(url) {
        try {
            const response = await this.axiosInstance.get(url);
            return response.data;
        }
        catch (error) {
            // エラーハンドリングの強化（ログ出力など）はここで行う
            console.error(`Failed to fetch URL: ${url}`, error);
            throw error;
        }
    }
    /**
     * HTML文字列をパースしてCheerioAPIオブジェクトを返す
     * @param html HTML文字列
     * @returns CheerioAPI ($関数)
     */
    parseHtml(html) {
        return (0, cheerio_1.load)(html);
    }
    /**
     * 指定されたURLのページを取得し、パース済みのCheerioオブジェクトを返すショートカット
     * @param url 取得対象のURL
     */
    async fetchAndParse(url) {
        const html = await this.fetchHtml(url);
        return this.parseHtml(html);
    }
    /**
     * ユーティリティ: テキストのクリーニング
     * 余分な空白や改行を除去する
     */
    cleanText(text) {
        return text.replace(/\s+/g, ' ').trim();
    }
}
exports.BaseScraper = BaseScraper;
//# sourceMappingURL=BaseScraper.js.map