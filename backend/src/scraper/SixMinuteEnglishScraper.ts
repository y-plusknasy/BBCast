import { IndexPageScraper, IndexPageConfig } from './IndexPageScraper';
import { EpisodeDetail, VocabularyItem, ScriptLine } from './types';
import { SixMinuteEnglishQuizScraper } from './SixMinuteEnglishQuizScraper';
import { CheerioAPI } from 'cheerio';

export class SixMinuteEnglishScraper extends IndexPageScraper {
  private quizScraper: SixMinuteEnglishQuizScraper;

  private static readonly DEFAULT_CONFIG: IndexPageConfig = {
    // 最新のエピソード(Featured)と過去のエピソード(List)の両方を対象にする
    listSelector: '.widget-bbcle-coursecontentlist-featured, .widget-progress-enabled li',
    urlSelector: 'a',
    titleSelector: 'h2',
    dateSelector: '.details h3',
    descriptionSelector: 'p'
  };

  constructor(baseUrl: string = 'https://www.bbc.co.uk') {
    // BBCのドメインをBaseURLとして設定
    super(baseUrl, SixMinuteEnglishScraper.DEFAULT_CONFIG);
    this.quizScraper = new SixMinuteEnglishQuizScraper();
  }

  /**
   * エピソード詳細ページをスクレイピングする
   * @param url エピソード詳細ページのURL
   */
  public async scrapeEpisode(url: string): Promise<EpisodeDetail> {
    const $ = await this.fetchAndParse(url);
    
    // タイトル取得
    // <div class="widget widget-heading ..."><h3>Title</h3></div>
    const titles = $('.widget.widget-heading h3')
      .map((_, el) => this.cleanText($(el).text()))
      .get()
      .filter(text => text !== '6 Minute English');

    const title = titles.length > 0 ? titles[0] : '';
    
    // 公開日取得
    // <div class="widget widget-bbcle-featuresubheader">...<h3><b>Episode ...</b> / 25 Dec 2025</h3>...</div>
    let dateStr = this.cleanText($('.widget.widget-bbcle-featuresubheader h3').text());
    // "Episode 251225 / 25 Dec 2025" のような形式から日付部分を抽出
    if (dateStr.includes('/')) {
      dateStr = dateStr.split('/')[1].trim();
    }
    
    const parsedDate = new Date(dateStr);
    const date = isNaN(parsedDate.getTime()) ? undefined : parsedDate;

    // Description取得
    const description = $('meta[name="description"]').attr('content') || '';

    const mp3Url = this.extractMp3Url($);
    const quizUrl = this.extractQuizUrl($);
    const vocabulary = this.extractVocabulary($);
    const script = this.extractScript($);

    let quizContent;
    if (quizUrl) {
      console.log(`Fetching quiz content from: ${quizUrl}`);
      quizContent = await this.quizScraper.scrapeQuiz(quizUrl);
    }

    return {
      title,
      description,
      date,
      url,
      mp3Url,
      quizUrl,
      quizContent,
      vocabulary,
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
   * クイズページへのリンクを抽出
   */
  private extractQuizUrl($: CheerioAPI): string | undefined {
    // "Try our free interactive quiz" などの文言を含むリンクを探す
    // 優先度1: h3の中にあるリンク
    let quizUrl = $('h3:contains("Try our") a').attr('href');
    
    // 優先度2: テキストに "interactive quiz" を含むリンク
    if (!quizUrl) {
      quizUrl = $('a:contains("interactive quiz")').attr('href');
    }

    // 相対パスの場合は絶対パスに変換
    if (quizUrl && quizUrl.startsWith('/')) {
      quizUrl = `${this.baseUrl}${quizUrl}`;
    }

    return quizUrl;
  }

  /**
   * 語彙リストを抽出
   */
  private extractVocabulary($: CheerioAPI): VocabularyItem[] {
    const vocabItems: VocabularyItem[] = [];
    const vocabHeader = $('h3:contains("Vocabulary")');

    if (vocabHeader.length > 0) {
      // Vocabularyヘッダーの次の要素から探索開始
      let currentElement = vocabHeader.next();

      // 次のh3タグやセクションの終わりまでループ
      while (currentElement.length > 0 && !currentElement.is('h3')) {
        // pタグのみを対象とする
        if (currentElement.is('p')) {
          const strongTag = currentElement.find('strong, b');
          
          // <strong>タグがある場合のみ処理 (これが単語)
          if (strongTag.length > 0) {
            const word = strongTag.text().trim();
            
            // <br>タグで分割して定義を取得する試み
            // 構造: <p><strong>Word</strong><br>Definition</p>
            // strongタグを除去した残りのテキストを取得
            const clone = currentElement.clone();
            clone.find('strong, b').remove();
            const definition = clone.text().trim();

            if (word && definition) {
              vocabItems.push({ word, definition });
            }
          } else {
            // <strong>がないpタグ（例: 画像リンクなど）が来たら、Vocabularyセクション終了とみなすか判断
            // ここでは、明らかにVocabularyの形式でないものが来たらループを抜けるのが安全
            // ただし、空行(&nbsp;)などはスキップしたい
            const text = currentElement.text().trim();
            if (text && !text.match(/^(&nbsp;|\s)*$/)) {
               // 何か意味のあるテキストやコンテンツがあるが、単語定義の形式ではない -> 終了
               break;
            }
          }
        }
        
        currentElement = currentElement.next();
      }
    }

    return vocabItems;
  }

  /**
   * スクリプト本文を抽出
   */
  private extractScript($: CheerioAPI): ScriptLine[] {
    const scriptLines: ScriptLine[] = [];

    // "TRANSCRIPT" という文字を含むラベルを探す
    const transcriptLabel = $('strong:contains("TRANSCRIPT"), b:contains("TRANSCRIPT")');
    
    if (transcriptLabel.length === 0) {
      return [];
    }

    // ラベルを含む親のpタグを見つける
    let currentElement = transcriptLabel.closest('p');
    
    // 次の要素へ移動（ここから本文開始）
    currentElement = currentElement.next();
    
    // "Note: This is not a word-for-word..." という注釈があればスキップ
    if (currentElement.text().includes('Note:')) {
      currentElement = currentElement.next();
    }

    // 次のセクション（h3など）が来るまで要素を取得し続ける
    while (currentElement.length > 0) {
      // h3タグなどが来たら終了（Vocabularyセクションなどの開始）
      if (currentElement.is('h3')) {
        break;
      }

      // pタグなら中身を詳細に解析
      if (currentElement.is('p')) {
        const contents = currentElement.contents().toArray();
        let currentSpeaker = '';
        let currentText = '';

        for (let i = 0; i < contents.length; i++) {
          const node = contents[i];
          const el = $(node);
          
          let isSpeaker = false;

          // strong/bタグかどうかチェック
          if (node.type === 'tag' && (node.name === 'strong' || node.name === 'b')) {
            // 前の要素を確認（空白テキストはスキップ）
            let prev = null;
            for (let j = i - 1; j >= 0; j--) {
              const p = contents[j];
              if (p.type === 'text' && $(p).text().trim() === '') continue;
              prev = p;
              break;
            }

            // 次の要素を確認（空白テキストはスキップ）
            let next = null;
            for (let j = i + 1; j < contents.length; j++) {
              const n = contents[j];
              if (n.type === 'text' && $(n).text().trim() === '') continue;
              next = n;
              break;
            }

            const isPrevBr = prev && prev.type === 'tag' && prev.name === 'br';
            const isNextBr = next && next.type === 'tag' && next.name === 'br';
            const isAtStart = prev === null;

            // 条件: 前後がBRタグ（または文頭 + BR）であること
            // ユーザー要件: "<strong>要素の前後両方がinnerHTMLを挟むことなく<br>要素で囲まれている場合"
            if ((isPrevBr || isAtStart) && isNextBr) {
              isSpeaker = true;
            }
          }

          if (isSpeaker) {
            // 前の話者のセリフがあれば保存
            if (currentSpeaker || currentText.trim()) {
              scriptLines.push({
                speaker: currentSpeaker,
                text: this.cleanText(currentText)
              });
            }
            // 新しい話者をセット
            currentSpeaker = this.cleanText(el.text());
            currentText = ''; // テキストリセット
          } 
          else {
            // テキストノードまたはその他のタグ（span, iなど）はセリフの一部
            // brタグは無視（スペース扱い済み）
            if (node.type === 'text' || (node.type === 'tag' && node.name !== 'br')) {
              currentText += el.text() + ' ';
            }
          }
        }

        // 最後の話者のセリフを保存
        if (currentSpeaker || currentText.trim()) {
          scriptLines.push({
            speaker: currentSpeaker,
            text: this.cleanText(currentText)
          });
        }
      }

      currentElement = currentElement.next();
    }

    return scriptLines;
  }
}
