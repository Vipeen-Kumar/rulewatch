import { redis } from '@devvit/web/server';
import type {
  CaseStatus,
  NoteEntry,
  PostScanResult,
  TimelineEvent,
  WarningEntry,
} from '../../shared/api';

const getKeyPrefix = (postId: string) => `rulewatch:${postId}`;

const getWarningsKey = (postId: string) => `${getKeyPrefix(postId)}:warnings`;

const getNotesKey = (postId: string) => `${getKeyPrefix(postId)}:notes`;

const getCaseStatusKey = (postId: string) => `${getKeyPrefix(postId)}:case_status`;

const getTimelineKey = (postId: string) => `${getKeyPrefix(postId)}:timeline`;

const getScanResultKey = (postId: string) => `${getKeyPrefix(postId)}:scan`;

const getDashboardTargetKey = (postId: string) =>
  `${getKeyPrefix(postId)}:target_post`;

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
  console.log(`[RuleWatch] loadWarnings for post ${postId}`);
  const raw = await redis.get(getWarningsKey(postId));
  const parsed = safeParse<WarningEntry[]>(raw);
  console.log(
    `[RuleWatch] loadWarnings result count ${Array.isArray(parsed) ? parsed.length : 0}`
  );
  return Array.isArray(parsed) ? parsed : [];
};

export const saveWarnings = async (postId: string, warnings: WarningEntry[]) => {
  console.log(`[RuleWatch] saveWarnings count ${warnings.length} for post ${postId}`);
  await redis.set(getWarningsKey(postId), JSON.stringify(warnings));
  return warnings;
};

export const loadNotes = async (postId: string) => {
  console.log(`[RuleWatch] loadNotes for post ${postId}`);
  const raw = await redis.get(getNotesKey(postId));
  const parsed = safeParse<NoteEntry[]>(raw);
  console.log(
    `[RuleWatch] loadNotes result count ${Array.isArray(parsed) ? parsed.length : 0}`
  );
  return Array.isArray(parsed) ? parsed : [];
};

export const saveNotes = async (postId: string, notes: NoteEntry[]) => {
  console.log(`[RuleWatch] saveNotes count ${notes.length} for post ${postId}`);
  await redis.set(getNotesKey(postId), JSON.stringify(notes));
  return notes;
};

export const loadCaseStatus = async (postId: string): Promise<CaseStatus> => {
  console.log(`[RuleWatch] loadCaseStatus for post ${postId}`);
  const raw = await redis.get(getCaseStatusKey(postId));
  const validStatuses: CaseStatus[] = [
    'Open',
    'Under Review',
    'Escalated',
    'Resolved',
    'Banned',
  ];
  if (raw && validStatuses.includes(raw as CaseStatus)) {
    return raw as CaseStatus;
  }
  return 'Open';
};

export const saveCaseStatus = async (postId: string, status: CaseStatus) => {
  console.log(`[RuleWatch] saveCaseStatus ${status} for post ${postId}`);
  await redis.set(getCaseStatusKey(postId), status);
  return status;
};

export const loadTimelineEvents = async (postId: string) => {
  console.log(`[RuleWatch] loadTimelineEvents for post ${postId}`);
  const raw = await redis.get(getTimelineKey(postId));
  const parsed = safeParse<TimelineEvent[]>(raw);
  console.log(
    `[RuleWatch] loadTimelineEvents result count ${Array.isArray(parsed) ? parsed.length : 0}`
  );
  return Array.isArray(parsed) ? parsed : [];
};

export const saveTimelineEvents = async (
  postId: string,
  events: TimelineEvent[]
) => {
  console.log(`[RuleWatch] saveTimelineEvents count ${events.length} for post ${postId}`);
  await redis.set(getTimelineKey(postId), JSON.stringify(events));
  return events;
};

export const appendTimelineEvent = async (
  postId: string,
  event: TimelineEvent
) => {
  const existing = await loadTimelineEvents(postId);
  const updated = [event, ...existing];
  await saveTimelineEvents(postId, updated);
  return updated;
};

export const loadScanResult = async (postId: string) => {
  console.log(`[RuleWatch] loadScanResult for post ${postId}`);
  const raw = await redis.get(getScanResultKey(postId));
  console.log(
    `[RuleWatch] loadScanResult raw ${raw ? 'found' : 'missing'} for post ${postId}`
  );
  const parsed = safeParse<PostScanResult>(raw);
  console.log(
    `[RuleWatch] loadScanResult parsed ${parsed ? 'ok' : 'null'} for post ${postId}`
  );
  return parsed ?? null;
};

export const saveScanResult = async (postId: string, result: PostScanResult) => {
  console.log(`[RuleWatch] saveScanResult for post ${postId}`);
  try {
    await redis.set(getScanResultKey(postId), JSON.stringify(result));
    console.log(`[RuleWatch] saveScanResult success for post ${postId}`);
  } catch (error) {
    console.error(`[RuleWatch] saveScanResult failure for post ${postId}`, error);
    throw error;
  }
  return result;
};

export const saveDashboardTarget = async (
  dashboardPostId: string,
  targetPostId: string
) => {
  const payload = {
    targetPostId,
    createdAt: new Date().toISOString(),
  };
  await redis.set(getDashboardTargetKey(dashboardPostId), JSON.stringify(payload));
  return payload;
};

export const loadDashboardTarget = async (dashboardPostId: string) => {
  const raw = await redis.get(getDashboardTargetKey(dashboardPostId));
  return safeParse<{ targetPostId: string; createdAt: string }>(raw);
};
