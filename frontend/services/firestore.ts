import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  doc,
  getDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { COLLECTIONS, PAGINATION, EpisodeSchema, ProgramSchema } from '@bbcast/shared';
import type { Episode, Program } from '@bbcast/shared';

// プログラム ID をキーに持つ型
export type ProgramWithId = Program & { id: string };
export type EpisodeWithId = Episode & { id: string };

// 全番組を取得
export async function getPrograms(): Promise<ProgramWithId[]> {
  const snapshot = await getDocs(collection(db, COLLECTIONS.PROGRAMS));
  return snapshot.docs.map((doc) => {
    const data = ProgramSchema.parse(doc.data());
    return { ...data, id: doc.id };
  });
}

// 番組を1件取得
export async function getProgram(programId: string): Promise<ProgramWithId | null> {
  const docRef = doc(db, COLLECTIONS.PROGRAMS, programId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = ProgramSchema.parse(snapshot.data());
  return { ...data, id: snapshot.id };
}

// エピソード一覧を取得（ページネーション付き）
export async function getEpisodes(
  programId: string,
  pageSize: number = PAGINATION.EPISODES_PER_PAGE,
  lastDoc?: QueryDocumentSnapshot<DocumentData>,
): Promise<{ episodes: EpisodeWithId[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }> {
  let q = query(
    collection(db, COLLECTIONS.EPISODES),
    where('programId', '==', programId),
    orderBy('date', 'desc'),
    limit(pageSize),
  );

  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }

  const snapshot = await getDocs(q);
  const episodes = snapshot.docs.map((doc) => {
    const data = EpisodeSchema.parse(doc.data());
    return { ...data, id: doc.id };
  });

  const newLastDoc = snapshot.docs.length > 0
    ? snapshot.docs[snapshot.docs.length - 1]
    : null;

  return { episodes, lastDoc: newLastDoc };
}

// エピソード1件取得
export async function getEpisode(episodeId: string): Promise<EpisodeWithId | null> {
  const docRef = doc(db, COLLECTIONS.EPISODES, episodeId);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  const data = EpisodeSchema.parse(snapshot.data());
  return { ...data, id: snapshot.id };
}
