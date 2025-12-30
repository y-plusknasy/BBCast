import * as admin from 'firebase-admin';
import { EpisodeDetail, ProgramConfig } from '../scraper/types';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
db.settings({ ignoreUndefinedProperties: true });

export class Repository {
  /**
   * プログラムの最新エピソードを取得する
   * @param programId プログラムID
   */
  async getLastEpisode(programId: string): Promise<EpisodeDetail | null> {
    const snapshot = await db.collection('episodes')
      .where('programId', '==', programId)
      .orderBy('date', 'desc') // 日付順で降順
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const data = snapshot.docs[0].data();
    // FirestoreのデータをEpisodeDetail型に変換（必要に応じて）
    return data as EpisodeDetail;
  }

  /**
   * エピソードを保存する
   * @param programId プログラムID
   * @param episode エピソード詳細データ
   */
  async saveEpisode(programId: string, episode: EpisodeDetail): Promise<void> {
    // URLからスラッグを生成してドキュメントIDにする
    // 例: /features/6-minute-english/ep-231228 -> 6-minute-english-ep-231228
    const slug = episode.url.split('/').pop() || Date.now().toString();
    const docId = `${programId}-${slug}`;

    const docRef = db.collection('episodes').doc(docId);
    
    await docRef.set({
      ...episode,
      programId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    console.log(`Saved episode: ${docId}`);
  }

  /**
   * プログラム情報を保存/更新する
   */
  async saveProgram(program: ProgramConfig): Promise<void> {
    await db.collection('programs').doc(program.id).set({
      title: program.title,
      urlPath: program.urlPath,
      baseUrl: 'https://www.bbc.co.uk', // Configから取得すべきだが一旦固定
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }
}
