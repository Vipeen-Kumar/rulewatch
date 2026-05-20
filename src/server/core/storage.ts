import { redis } from '@devvit/web/server';
import type { NoteEntry, WarningEntry } from '../../shared/api';

const getKeyPrefix = (postId: string) => `rulewatch:${postId}`;

const getWarningsKey = (postId: string) => `${getKeyPrefix(postId)}:warnings`;

const getNotesKey = (postId: string) => `${getKeyPrefix(postId)}:notes`;

const safeParse = <T>(value: string | null) => {
  if (!value) {
    return null;
  }
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const loadWarnings = async (postId: string) => {
  const raw = await redis.get(getWarningsKey(postId));
  const parsed = safeParse<WarningEntry[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
};

export const saveWarnings = async (postId: string, warnings: WarningEntry[]) => {
  await redis.set(getWarningsKey(postId), JSON.stringify(warnings));
  return warnings;
};

export const loadNotes = async (postId: string) => {
  const raw = await redis.get(getNotesKey(postId));
  const parsed = safeParse<NoteEntry[]>(raw);
  return Array.isArray(parsed) ? parsed : [];
};

export const saveNotes = async (postId: string, notes: NoteEntry[]) => {
  await redis.set(getNotesKey(postId), JSON.stringify(notes));
  return notes;
};
