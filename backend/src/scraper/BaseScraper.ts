import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { load, CheerioAPI } from 'cheerio';

/**
 * BaseScraper
 * 
 * Webスクレイピングの基底クラス。
 * HTTPリクエストの送信とHTMLパースの共通機能を提供する。
 */
export abstract class BaseScraper {
  protected axiosInstance: AxiosInstance;
  protected baseUrl?: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl;
    const config: AxiosRequestConfig = {
      timeout: 10000, // 10秒タイムアウト
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BBCast/1.0; +https://github.com/y-plusknasy/BBCast)',
      },
    };

    if (baseUrl) {
      config.baseURL = baseUrl;
    }

    this.axiosInstance = axios.create(config);
  }

  /**
   * 指定されたURLからHTMLを取得する
   * @param url 取得対象のURL（baseURLが設定されている場合は相対パス可）
   * @returns HTML文字列
   */
  protected async fetchHtml(url: string): Promise<string> {
    try {
      const response = await this.axiosInstance.get(url);
      return response.data;
    } catch (error) {
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
  protected parseHtml(html: string): CheerioAPI {
    return load(html);
  }

  /**
   * 指定されたURLのページを取得し、パース済みのCheerioオブジェクトを返すショートカット
   * @param url 取得対象のURL
   */
  protected async fetchAndParse(url: string): Promise<CheerioAPI> {
    const html = await this.fetchHtml(url);
    return this.parseHtml(html);
  }

  /**
   * ユーティリティ: テキストのクリーニング
   * 余分な空白や改行を除去する
   */
  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
