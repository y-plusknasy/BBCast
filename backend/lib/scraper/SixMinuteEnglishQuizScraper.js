"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SixMinuteEnglishQuizScraper = void 0;
const BaseScraper_1 = require("./BaseScraper");
const vm = __importStar(require("vm"));
class SixMinuteEnglishQuizScraper extends BaseScraper_1.BaseScraper {
    constructor() {
        super();
    }
    /**
     * BBCのクイズページURLからクイズデータを取得する
     * @param bbcQuizUrl BBCのクイズページURL
     */
    async scrapeQuiz(bbcQuizUrl) {
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
        }
        catch (error) {
            console.error(`Failed to scrape quiz from ${bbcQuizUrl}`, error);
            return [];
        }
    }
    /**
     * RiddleのJSONデータからクイズ問題を抽出する
     */
    parseRiddleData(data) {
        var _a, _b;
        const questions = [];
        // データ構造のチェック
        if (!((_b = (_a = data === null || data === void 0 ? void 0 : data.data) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.pageGroups)) {
            return [];
        }
        const pageGroups = data.data.data.pageGroups;
        // 全てのページグループとページを走査
        for (const group of pageGroups) {
            if (!group.pages)
                continue;
            for (const page of group.pages) {
                // クイズ問題のページのみ対象
                if (page.templateId === 'quiz-question') {
                    const questionText = this.cleanHtml(page.title);
                    const options = [];
                    let answerIndex = -1;
                    if (page.allAnswers && Array.isArray(page.allAnswers)) {
                        page.allAnswers.forEach((ans, index) => {
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
    cleanHtml(html) {
        if (!html)
            return '';
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
exports.SixMinuteEnglishQuizScraper = SixMinuteEnglishQuizScraper;
//# sourceMappingURL=SixMinuteEnglishQuizScraper.js.map