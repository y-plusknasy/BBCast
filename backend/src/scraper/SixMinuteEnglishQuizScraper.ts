import { BaseScraper } from './BaseScraper';
import { QuizQuestion, QuizOption } from './types';
import * as vm from 'vm';

export class SixMinuteEnglishQuizScraper extends BaseScraper {
  constructor() {
    super();
  }

  /**
   * BBCのクイズページURLからクイズデータを取得する
   * @param bbcQuizUrl BBCのクイズページURL
   */
  public async scrapeQuiz(bbcQuizUrl: string): Promise<QuizQuestion[]> {
    try {
      // 1. BBCのクイズページを取得
      const $bbc = await this.fetchAndParse(bbcQuizUrl);
      
      // 2. iframeのsrcを取得 (Riddle.com)
      const iframeSrc = $bbc('iframe[src*="riddle.com"]').attr('src');
      if (!iframeSrc) {
        console.warn(`Riddle quiz iframe not found in: ${bbcQuizUrl}`);
        return [];
      }

      // プロトコル相対URLの対応
      const riddleUrl = iframeSrc.startsWith('//') ? `https:${iframeSrc}` : iframeSrc;

      // 3. Riddle.comのページを取得
      const riddleHtml = await this.fetchHtml(riddleUrl);

      // 4. JSONデータを抽出
      // window.riddle_view = { ... } </script> という形式を探す
      // セミコロンがない場合や、scriptタグの終了直前まで続く場合に対応
      const jsonMatch = riddleHtml.match(/window\.riddle_view\s*=\s*({[\s\S]*?})\s*<\/script>/);
      if (!jsonMatch) {
        console.warn(`Riddle view data not found in: ${riddleUrl}`);
        return [];
      }

      // JSオブジェクトリテラルなので、vmを使ってパースする
      const objectLiteral = jsonMatch[1];
      const sandbox = { result: null };
      vm.createContext(sandbox);
      vm.runInContext(`result = ${objectLiteral}`, sandbox);
      
      return this.parseRiddleData(sandbox.result);

    } catch (error) {
      console.error(`Failed to scrape quiz from ${bbcQuizUrl}`, error);
      return [];
    }
  }

  /**
   * RiddleのJSONデータからクイズ問題を抽出する
   */
  private parseRiddleData(data: any): QuizQuestion[] {
    const questions: QuizQuestion[] = [];

    // データ構造のチェック
    if (!data?.data?.data?.pageGroups) {
      return [];
    }

    const pageGroups = data.data.data.pageGroups;

    // 全てのページグループとページを走査
    for (const group of pageGroups) {
      if (!group.pages) continue;

      for (const page of group.pages) {
        // クイズ問題のページのみ対象
        if (page.templateId === 'quiz-question') {
          const questionText = this.cleanHtml(page.title);
          const options: QuizOption[] = [];
          let answerIndex = -1;

          if (page.allAnswers && Array.isArray(page.allAnswers)) {
            page.allAnswers.forEach((ans: any, index: number) => {
              const isCorrect = ans.isMultiCorrect === true;
              if (isCorrect) {
                answerIndex = index;
              }
              options.push({
                label: this.cleanHtml(ans.label),
                isCorrect: isCorrect
              });
            });
          }

          if (questionText && options.length > 0) {
            questions.push({
              question: questionText,
              options,
              answerIndex
            });
          }
        }
      }
    }

    return questions;
  }

  /**
   * HTMLタグを除去してテキストをきれいにする
   */
  private cleanHtml(html: string): string {
    if (!html) return '';
    // HTMLタグ除去
    let text = html.replace(/<[^>]*>/g, '');
    // HTMLエンティティデコード (簡易版)
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"');
    return this.cleanText(text);
  }
}
