import { IndexPageScraper, IndexPageConfig } from './IndexPageScraper';
import { EpisodeDetail, ScriptLine } from './types';
import { CheerioAPI } from 'cheerio';

export class TheEnglishWeSpeakScraper extends IndexPageScraper {
  private static readonly DEFAULT_CONFIG: IndexPageConfig = {
    // 最新のエピソード(Featured)と過去のエピソード(List)の両方を対象にする
    listSelector: '.widget-bbcle-coursecontentlist-featured, .widget-progress-enabled li',
    urlSelector: 'a',
    titleSelector: 'h2',
    dateSelector: '.details h3',
    descriptionSelector: 'p'
  };

  constructor(baseUrl: string = 'https://www.bbc.co.uk') {
    super(baseUrl, TheEnglishWeSpeakScraper.DEFAULT_CONFIG);
  }

  /**
   * エピソード詳細ページをスクレイピングする
   * @param url エピソード詳細ページのURL
   */
  public async scrapeEpisode(url: string): Promise<EpisodeDetail> {
    const $ = await this.fetchAndParse(url);
    
    // タイトル取得
    // <div class="widget widget-heading ..."><h3>Title</h3></div>
    // ページには "The English We Speak" というタイトルのh3と、エピソードタイトルのh3がある場合がある
    const titles = $('.widget.widget-heading h3').map((_, el) => $(el).text().trim()).get();
    // プログラム名以外のタイトルを探す、なければ最後の要素を使う（通常エピソードタイトルは後にある）
    const episodeTitle = titles.find(t => t !== 'The English We Speak') || titles[titles.length - 1];
    const title = this.cleanText(episodeTitle || '');
    
    // 公開日取得
    // <div class="widget widget-bbcle-featuresubheader">...<h3><b>Episode ...</b> / 25 Dec 2025</h3>...</div>
    let date = this.cleanText($('.widget.widget-bbcle-featuresubheader h3').text());
    // "Episode 251225 / 25 Dec 2025" のような形式から日付部分を抽出
    if (date.includes('/')) {
      date = date.split('/')[1].trim();
    }

    // Description取得
    const description = $('meta[name="description"]').attr('content') || '';

    const mp3Url = this.extractMp3Url($);
    const script = this.extractScript($);

    return {
      title,
      description,
      date,
      url,
      mp3Url,
      quizUrl: undefined,
      quizContent: undefined,
      vocabulary: [], // Vocabularyは取得しない
      script
    };
  }

  /**
   * MP3のダウンロードURLを抽出
   */
  private extractMp3Url($: CheerioAPI): string | undefined {
    // .mp3 で終わるリンクを探す
    return $('a[href$=".mp3"]').attr('href');
  }

  /**
   * スクリプトを抽出
   */
  private extractScript($: CheerioAPI): ScriptLine[] {
    const script: ScriptLine[] = [];
    let currentSpeaker = '';
    
    // 1. Transcriptの開始位置を探す
    // ユーザー指定: <p><strong>Transcript</strong></p>
    let startNode = $('p').filter((_, el) => {
        const text = $(el).text().trim();
        return text === 'Transcript';
    }).first();

    // フォールバック: h3タグの場合もあるかもしれないので維持
    if (startNode.length === 0) {
        startNode = $('h3').filter((_, el) => $(el).text().trim() === 'Transcript').first();
    }

    if (startNode.length > 0) {
        // 開始ノードの次の兄弟要素から走査開始
        let nextNode = startNode.next();
        
        while (nextNode.length > 0) {
            // 3. 終了条件: <h3 class="paragraph">Next...</h3>
            // タグがh3、またはテキストに "Next" を含むh3が来た場合
            if (nextNode.is('h3') || nextNode.find('h3').length > 0) {
                const text = nextNode.text().trim();
                if (text.startsWith('Next')) {
                    break;
                }
            }

            // p要素を処理
            if (nextNode.is('p')) {
                const p = nextNode;
                const strong = p.find('strong, b').first();
                
                if (strong.length > 0) {
                    // 1. 話者がいる場合
                    currentSpeaker = this.cleanText(strong.text());
                    
                    // 話者名を除いたテキストを取得するために、要素を複製してstrongタグを削除
                    const pClone = p.clone();
                    pClone.find('strong, b').remove();
                    let text = this.cleanText(pClone.text());
                    
                    // 先頭のコロンや空白を削除 (例: "Feifei: Hello" -> "Hello")
                    text = text.replace(/^[:\s]+/, '');

                    if (currentSpeaker && text) {
                        script.push({ speaker: currentSpeaker, text });
                    }
                } else {
                    // 2. 話者がいない場合（直前の話者の継続）
                    // innerHTMLだけのP要素など
                    let text = this.cleanText(p.text());
                    if (currentSpeaker && text) {
                        script.push({ speaker: currentSpeaker, text });
                    }
                }
            }

            nextNode = nextNode.next();
        }
    } else {
        // Transcriptヘッダーが見つからない場合のフォールバック
        // widget-richtextクラスを持つウィジェットを探し、会話形式のテキストを探す
        $('.widget-richtext p').each((_, el) => {
            const p = $(el);
            const strong = p.find('strong, b').first();
            if (strong.length > 0) {
                const speaker = this.cleanText(strong.text());
                const pClone = p.clone();
                pClone.find('strong, b').remove();
                let text = this.cleanText(pClone.text());
                text = text.replace(/^[:\s]+/, '');
                
                // 話者名があり、かつテキストがある場合のみ追加
                // "Vocabulary" などのセクションヘッダーがstrongで書かれている場合を除外するための簡易チェック
                if (speaker && text && speaker.length < 20) { 
                    script.push({ speaker, text });
                }
            }
        });
    }

    return script;
  }
}
