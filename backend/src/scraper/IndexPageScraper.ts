import { BaseScraper } from './BaseScraper';
import { CheerioAPI } from 'cheerio';
import { EpisodeDetail, EpisodeSummary } from './types';

export interface IndexPageConfig {
  listSelector: string;      // リストアイテム（各エピソードのコンテナ）のセレクタ
  urlSelector: string;       // リストアイテム内の詳細ページURLのセレクタ
  titleSelector: string;     // リストアイテム内のタイトルのセレクタ
  dateSelector?: string;     // リストアイテム内の日付のセレクタ（任意）
  descriptionSelector?: string; // リストアイテム内の概要のセレクタ（任意）
}

/**
 * IndexPageScraper
 * 
 * 番組の目次ページ（Index Page）を解析するための基底クラス。
 * 具体的なセレクタはコンストラクタまたは設定で受け取る。
 */
export abstract class IndexPageScraper extends BaseScraper {
  protected config: IndexPageConfig;

  constructor(baseUrl: string, config: IndexPageConfig) {
    super(baseUrl);
    this.config = config;
  }

  /**
   * 目次ページをスクレイピングし、エピソードのリストを返す
   * @param url 目次ページのURL（相対パス可）
   * @returns エピソード概要のリスト
   */
  public async scrapeIndex(url: string): Promise<EpisodeSummary[]> {
    const $ = await this.fetchAndParse(url);
    return this.extractEpisodes($);
  }

  /**
   * エピソード詳細ページをスクレイピングする
   * @param url エピソード詳細ページのURL
   */
  public abstract scrapeEpisode(url: string): Promise<EpisodeDetail>;

  /**
   * Cheerioオブジェクトからエピソード情報を抽出する
   */
  protected extractEpisodes($: CheerioAPI): EpisodeSummary[] {
    const episodes: EpisodeSummary[] = [];
    const { listSelector, urlSelector, titleSelector, dateSelector, descriptionSelector } = this.config;

    $(listSelector).each((_, element) => {
      const el = $(element);
      
      // URLの抽出と正規化
      let episodeUrl = el.find(urlSelector).attr('href');
      if (!episodeUrl) return; // URLがない場合はスキップ
      
      // 相対パスなら絶対パスに変換
      if (episodeUrl.startsWith('/')) {
        episodeUrl = `${this.baseUrl}${episodeUrl}`;
      }

      // タイトルの抽出
      const title = this.cleanText(el.find(titleSelector).text());

      const summary: EpisodeSummary = {
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
