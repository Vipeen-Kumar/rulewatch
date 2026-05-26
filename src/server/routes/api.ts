import { Hono, type Context } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  CurrentAuthorResponse,
  DecrementResponse,
  IncrementResponse,
  InitResponse,
  LoadCaseStatusResponse,
  LoadNotesResponse,
  LoadScanResultResponse,
  LoadTimelineResponse,
  LoadWarningsResponse,
  PostScanResult,
  AppendTimelineRequest,
  AppendTimelineResponse,
  SaveCaseStatusRequest,
  SaveCaseStatusResponse,
  TargetPostResponse,
  UserSearchResponse,
  UserProfileResponse,
  SaveNotesRequest,
  SaveNotesResponse,
  SaveWarningsRequest,
  SaveWarningsResponse,
} from '../../shared/api';
import {
  appendTimelineEvent,
  loadCaseStatus,
  loadDashboardTarget,
  loadNotes,
  loadScanResult,
  loadTimelineEvents,
  loadWarnings,
  saveCaseStatus,
  saveScanResult,
  saveNotes,
  saveTimelineEvents,
  saveWarnings,
} from '../core/storage';
import { fetchUserProfile } from '../core/redditProfile';
import { buildPostScanResult } from '../core/scan';

type ErrorResponse = {
  status: 'error';
  message: string;
};

const ensureT3Prefix = (id: string) => (id.startsWith('t3_') ? id : `t3_${id}`);

const getEffectivePostId = async (c: Context) => {
  const queryId = c.req.query('targetPostId');
  if (queryId) {
    return queryId;
  }

  const { postId } = context;
  if (!postId) {
    return null;
  }

  const mapped = await loadDashboardTarget(postId);
  return mapped?.targetPostId ?? postId;
};

export const api = new Hono();

api.get('/user-search', async (c) => {
  const rawQuery = c.req.query('q') ?? '';
  const normalized = rawQuery.replace(/^u\//i, '').trim();
  console.log('[RuleWatch] user-search query', { rawQuery, normalized });
  if (!normalized) {
    return c.json<UserSearchResponse>({ type: 'user_search', users: [] });
  }

  try {
    const url = `https://www.reddit.com/api/user_search.json?query=${encodeURIComponent(
      normalized
    )}&raw_json=1`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`User search failed with ${response.status}`);
    }
    const payload = (await response.json()) as {
      names?: string[];
      data?: { children?: Array<{ data?: { name?: string; total_karma?: number; created_utc?: number } }> };
    };

    const users: string[] = [];
    const meta: Record<string, { karma?: number; accountAgeDays?: number }> = {};

    if (Array.isArray(payload.names)) {
      users.push(...payload.names);
    } else if (Array.isArray(payload.data?.children)) {
      payload.data?.children?.forEach((child) => {
        const username = child.data?.name;
        if (username) {
          users.push(username);
          const karma = child.data?.total_karma;
          const createdUtc = child.data?.created_utc;
          meta[username] = {
            karma: typeof karma === 'number' ? karma : undefined,
            accountAgeDays:
              typeof createdUtc === 'number'
                ? Math.max(0, Math.floor((Date.now() - createdUtc * 1000) / (1000 * 60 * 60 * 24)))
                : undefined,
          };
        }
      });
    }

    const limitedUsers = users
      .filter((name) => typeof name === 'string' && name.length > 0)
      .slice(0, 5);

    const limitedMeta: Record<string, { karma?: number; accountAgeDays?: number }> = {};
    limitedUsers.forEach((username) => {
      if (meta[username]) {
        limitedMeta[username] = meta[username];
      }
    });

    console.log('[RuleWatch] user-search results', limitedUsers);
    return c.json<UserSearchResponse>({
      type: 'user_search',
      users: limitedUsers,
      meta: Object.keys(limitedMeta).length ? limitedMeta : undefined,
    });
  } catch (error) {
    console.warn(`[RuleWatch] user-search failed: ${error}`);
    try {
      const user = await reddit.getUserByUsername(normalized);
      if (user) {
        const ageDays = Math.max(
          0,
          Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        );
        console.log('[RuleWatch] user-search fallback success', normalized);
        return c.json<UserSearchResponse>({
          type: 'user_search',
          users: [user.username],
          meta: {
            [user.username]: {
              karma: user.linkKarma + user.commentKarma,
              accountAgeDays: ageDays,
            },
          },
        });
      }
    } catch (fallbackError) {
      console.warn(`[RuleWatch] user-search fallback failed: ${fallbackError}`);
    }
    return c.json<UserSearchResponse>({ type: 'user_search', users: [] });
  }
});

api.get('/target-post', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  try {
    const post = await reddit.getPostById(ensureT3Prefix(postId));
    return c.json<TargetPostResponse>({
      type: 'target_post',
      postId,
      postIdFull: ensureT3Prefix(postId),
      author: post.authorName,
      title: post.title,
      body: post.body ?? '',
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load target post';
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message,
      },
      500
    );
  }
});

api.get('/current-author', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  try {
    const post = await reddit.getPostById(ensureT3Prefix(postId));
    const author = post.authorName;
    return c.json<CurrentAuthorResponse>({
      type: 'current_author',
      author,
      postId: post.id,
      postTitle: post.title,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load current author';
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message,
      },
      500
    );
  }
});

api.get('/user-profile', async (c) => {
  const username = c.req.query('username')?.trim();
  if (!username) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'username is required',
      },
      400
    );
  }

  try {
    const profile = await fetchUserProfile(username, 5);
    return c.json<UserProfileResponse>({
      type: 'user_profile',
      profile,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to load user profile';
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message,
      },
      message === 'User not found' ? 404 : 500
    );
  }
});

api.get('/case-status', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const status = await loadCaseStatus(postId);
  return c.json<LoadCaseStatusResponse>({
    type: 'case_status',
    status,
  });
});

api.put('/case-status', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const body = await c.req.json<SaveCaseStatusRequest>();
  const status = await saveCaseStatus(postId, body.status);
  return c.json<SaveCaseStatusResponse>({
    type: 'case_status_saved',
    status,
  });
});

api.get('/timeline', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const events = await loadTimelineEvents(postId);
  return c.json<LoadTimelineResponse>({
    type: 'timeline',
    events,
  });
});

api.get('/scan-result', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    console.warn('[RuleWatch] GET /scan-result missing postId');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  console.log(`[RuleWatch] GET /scan-result for post ${postId}`);
  const result = await loadScanResult(postId);
  if (!result) {
    console.warn(`[RuleWatch] GET /scan-result not found for post ${postId}`);
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'scan result not found',
      },
      404
    );
  }

  console.log(`[RuleWatch] GET /scan-result success for post ${postId}`);
  return c.json<LoadScanResultResponse>({
    type: 'scan_result',
    result,
  });
});

api.post('/scan-now', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  try {
    const post = await reddit.getPostById(ensureT3Prefix(postId));
    const authorName = post.authorName || 'unknown';

    let accountAgeDays = 0;
    let karma = 0;
    let postingFrequency = 0;

    if (authorName !== 'unknown') {
      try {
        const [user, postListing, commentListing] = await Promise.all([
          reddit.getUserByUsername(authorName),
          reddit.getPostsByUser({ username: authorName, sort: 'new', limit: 10, pageSize: 10 }),
          reddit.getCommentsByUser({ username: authorName, sort: 'new', limit: 10, pageSize: 10 }),
        ]);

        if (user) {
          const ageMs = Date.now() - user.createdAt.getTime();
          accountAgeDays = Math.max(0, Math.floor(ageMs / (24 * 60 * 60 * 1000)));
          karma = user.linkKarma + user.commentKarma;
        }

        const [recentPosts, recentComments] = await Promise.all([
          postListing.get(10),
          commentListing.get(10),
        ]);
        const cutoff = Date.now() - 24 * 60 * 60 * 1000;
        postingFrequency = [...recentPosts, ...recentComments].filter((item) => {
          const createdAt = item.createdAt?.getTime?.() ?? 0;
          return createdAt >= cutoff;
        }).length;
      } catch (error) {
        console.warn(`[RuleWatch] scan enrichment failed: ${error}`);
      }
    }

    const result: PostScanResult = buildPostScanResult({
      postId,
      title: post.title,
      body: post.body ?? '',
      author: authorName,
      subreddit: post.subredditName,
      createdAt: Math.floor(post.createdAt.getTime() / 1000),
      accountAgeDays,
      karma,
      postingFrequency,
    });

    await saveScanResult(postId, result);
    await appendTimelineEvent(postId, {
      id: `scan-${postId}-${Date.now()}`,
      type: 'scan_completed',
      timestamp: new Date().toISOString(),
      message: `Auto scan completed. Risk ${result.riskScore} (${result.recommendedAction}).`,
      actor: 'RuleWatch AI',
    });

    return c.json<LoadScanResultResponse>({
      type: 'scan_result',
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to scan post';
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message,
      },
      500
    );
  }
});

api.post('/timeline', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const body = await c.req.json<AppendTimelineRequest>();
  const events = await appendTimelineEvent(postId, body.event);
  return c.json<AppendTimelineResponse>({
    type: 'timeline_saved',
    events,
  });
});

api.delete('/timeline', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const events = await saveTimelineEvents(postId, []);
  return c.json<AppendTimelineResponse>({
    type: 'timeline_saved',
    events,
  });
});

api.get('/warnings', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const warnings = await loadWarnings(postId);
  return c.json<LoadWarningsResponse>({
    type: 'warnings',
    warnings,
  });
});

api.post('/warnings', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const body = await c.req.json<SaveWarningsRequest>();
  const warnings = await saveWarnings(postId, body.warnings ?? []);

  return c.json<SaveWarningsResponse>({
    type: 'warnings_saved',
    warnings,
  });
});

api.delete('/warnings', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  console.log(`[RuleWatch] DELETE /warnings for post ${postId}`);
  const warnings = await saveWarnings(postId, []);
  console.log(`[RuleWatch] Warnings cleared for post ${postId}`);
  return c.json<SaveWarningsResponse>({
    type: 'warnings_saved',
    warnings,
  });
});

api.get('/notes', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const notes = await loadNotes(postId);
  return c.json<LoadNotesResponse>({
    type: 'notes',
    notes,
  });
});

api.post('/notes', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const body = await c.req.json<SaveNotesRequest>();
  const notes = await saveNotes(postId, body.notes ?? []);

  return c.json<SaveNotesResponse>({
    type: 'notes_saved',
    notes,
  });
});

api.delete('/notes', async (c) => {
  const postId = await getEffectivePostId(c);
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  console.log(`[RuleWatch] DELETE /notes for post ${postId}`);
  const notes = await saveNotes(postId, []);
  console.log(`[RuleWatch] Notes cleared for post ${postId}`);
  return c.json<SaveNotesResponse>({
    type: 'notes_saved',
    notes,
  });
});

api.get('/init', async (c) => {
  const { postId } = context;

  if (!postId) {
    console.error('API Init Error: postId not found in devvit context');
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required but missing from context',
      },
      400
    );
  }

  try {
    const [count, username] = await Promise.all([
      redis.get('count'),
      reddit.getCurrentUsername(),
    ]);

    return c.json<InitResponse>({
      type: 'init',
      postId: postId,
      count: count ? parseInt(count) : 0,
      username: username ?? 'anonymous',
    });
  } catch (error) {
    console.error(`API Init Error for post ${postId}:`, error);
    let errorMessage = 'Unknown error during initialization';
    if (error instanceof Error) {
      errorMessage = `Initialization failed: ${error.message}`;
    }
    return c.json<ErrorResponse>(
      { status: 'error', message: errorMessage },
      400
    );
  }
});

api.post('/increment', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', 1);
  return c.json<IncrementResponse>({
    count,
    postId,
    type: 'increment',
  });
});

api.post('/decrement', async (c) => {
  const { postId } = context;
  if (!postId) {
    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'postId is required',
      },
      400
    );
  }

  const count = await redis.incrBy('count', -1);
  return c.json<DecrementResponse>({
    count,
    postId,
    type: 'decrement',
  });
});
