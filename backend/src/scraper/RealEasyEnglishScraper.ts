import { IndexPageScraper, IndexPageConfig } from './IndexPageScraper';
import { EpisodeDetail, VocabularyItem, ScriptLine } from './types';
import { CheerioAPI } from 'cheerio';

export class RealEasyEnglishScraper extends IndexPageScraper {
  private static readonly DEFAULT_CONFIG: IndexPageConfig = {
    listSelector: '.widget-bbcle-coursecontentlist-featured, .widget-progress-enabled li',
    urlSelector: 'a',
    titleSelector: 'h2',
    dateSelector: '.details h3',
    descriptionSelector: 'p'
  };

  constructor(baseUrl: string = 'https://www.bbc.co.uk') {
    super(baseUrl, RealEasyEnglishScraper.DEFAULT_CONFIG);
  }

  public async scrapeEpisode(url: string): Promise<EpisodeDetail> {
    const $ = await this.fetchAndParse(url);

    // タイトル取得
    const titles = $('.widget.widget-heading h3').map((_, el) => $(el).text().trim()).get();
    const programTitle = 'Real Easy English';
    let title = titles.find(t => t !== programTitle && !t.includes(programTitle));
    if (!title) {
        title = titles[titles.length - 1];
    }
    title = this.cleanText(title || '');

    // 公開日取得
    let date = this.cleanText($('.widget.widget-bbcle-featuresubheader h3').text());
    if (date.includes('/')) {
      date = date.split('/')[1].trim();
    }

    // Description取得: <h3>Introduction</h3> の後の pタグ
    let description = '';
    const introHeader = $('h3').filter((_, el) => $(el).text().trim() === 'Introduction');
    if (introHeader.length > 0) {
        let nextNode = introHeader.next();
        while (nextNode.length > 0) {
            if (nextNode.is('h3')) break; // 次のヘッダーで停止
            if (nextNode.is('p')) {
                description = this.cleanText(nextNode.text());
                if (description) break; // 最初の空でない段落を取得
            }
            nextNode = nextNode.next();
        }
    }
    if (!description) {
        description = $('meta[name="description"]').attr('content') || '';
    }

    const mp3Url = $('a[href$=".mp3"]').attr('href');
    const vocabulary = this.extractVocabulary($);
    const script = this.extractScript($);

    return {
      title,
      description,
      date,
      url,
      mp3Url,
      quizUrl: undefined,
      quizContent: undefined,
      vocabulary,
      script
    };
  }

  private extractVocabulary($: CheerioAPI): VocabularyItem[] {
    const vocabulary: VocabularyItem[] = [];
    const vocabHeader = $('h3').filter((_, el) => $(el).text().trim() === 'Vocabulary');
    
    if (vocabHeader.length > 0) {
        let nextNode = vocabHeader.next();
        while (nextNode.length > 0) {
            if (nextNode.is('h3')) break; // 次のヘッダー（例: Transcript）で停止

            if (nextNode.is('p')) {
                const p = nextNode;
                const strong = p.find('strong, b');
                if (strong.length > 0) {
                    const word = this.cleanText(strong.text());
                    const pClone = p.clone();
                    pClone.find('strong, b').remove();
                    let definition = this.cleanText(pClone.text());
                    definition = definition.replace(/^[:\-\s]+/, '');
                    
                    if (word && definition) {
                        vocabulary.push({ word, definition });
                    }
                }
            }
            nextNode = nextNode.next();
        }
    }
    return vocabulary;
  }

  private extractScript($: CheerioAPI): ScriptLine[] {
    const script: ScriptLine[] = [];
    const transcriptHeader = $('h3').filter((_, el) => $(el).text().trim() === 'Transcript');
    
    if (transcriptHeader.length > 0) {
        let nextNode = transcriptHeader.next();
        while (nextNode.length > 0) {
            if (nextNode.is('h3')) {
                break;
            }

            if (nextNode.is('p')) {
                const p = nextNode;
                const contents = p.contents().toArray();
                let currentSpeakerInP: string | null = null;
                let currentTextInP = '';
                let hasSpeakerInP = false;

                const pushLine = () => {
                    if (currentSpeakerInP && currentTextInP.trim()) {
                        let text = this.cleanText(currentTextInP);
                        text = text.replace(/^[:\s]+/, '');
                        if (text) {
                            script.push({ speaker: currentSpeakerInP, text });
                        }
                    }
                };

                for (let i = 0; i < contents.length; i++) {
                    const node = contents[i];
                    const $node = $(node);
                    
                    let isSpeaker = false;
                    if ($node.is('strong, b')) {
                        // 条件1: 段落の最初の子要素である
                        if (i === 0) {
                            isSpeaker = true;
                        } 
                        // 条件2: 直後に <br> タグがある（古い形式のTranscript対応）
                        else {
                            const nextNode = contents[i+1];
                            if (nextNode && $(nextNode).is('br')) {
                                isSpeaker = true;
                            }
                        }
                    }

                    if (isSpeaker) {
                        if (hasSpeakerInP) {
                            pushLine();
                        }
                        currentSpeakerInP = this.cleanText($node.text());
                        currentTextInP = '';
                        hasSpeakerInP = true;

                        // 直後の <br> をスキップ
                        const nextNode = contents[i+1];
                        if (nextNode && $(nextNode).is('br')) {
                            i++;
                        }
                    } else {
                        // テキストを追加
                        if (node.type === 'text') {
                            // @ts-ignore: node.data exists on Text nodes
                            currentTextInP += node.data;
                        } else if ($node.is('br')) {
                            currentTextInP += ' '; 
                        } else {
                            // その他のタグ（強調など）はテキストとして取得
                            currentTextInP += $node.text();
                        }
                    }
                }

                if (hasSpeakerInP) {
                    pushLine();
                } else {
                    // 話者が見つからない場合（継続行）
                    const text = this.cleanText(p.text());
                    if (text && script.length > 0) {
                        const lastSpeaker = script[script.length - 1].speaker;
                        script.push({ speaker: lastSpeaker, text });
                    }
                }
            }
            nextNode = nextNode.next();
        }
    }
    return script;
  }
}
