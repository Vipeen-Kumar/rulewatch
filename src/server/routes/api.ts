import { Hono } from 'hono';
import { context, redis, reddit } from '@devvit/web/server';
import type {
  DecrementResponse,
  IncrementResponse,
  InitResponse,
  LoadNotesResponse,
  LoadWarningsResponse,
  UserProfileResponse,
  SaveNotesRequest,
  SaveNotesResponse,
  SaveWarningsRequest,
  SaveWarningsResponse,
} from '../../shared/api';
import { loadNotes, loadWarnings, saveNotes, saveWarnings } from '../core/storage';
import { fetchUserProfile } from '../core/redditProfile';

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

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

api.get('/warnings', async (c) => {
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

  const warnings = await loadWarnings(postId);
  return c.json<LoadWarningsResponse>({
    type: 'warnings',
    warnings,
  });
});

api.post('/warnings', async (c) => {
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

  const body = await c.req.json<SaveWarningsRequest>();
  const warnings = await saveWarnings(postId, body.warnings ?? []);

  return c.json<SaveWarningsResponse>({
    type: 'warnings_saved',
    warnings,
  });
});

api.delete('/warnings', async (c) => {
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

  console.log(`[RuleWatch] DELETE /warnings for post ${postId}`);
  const warnings = await saveWarnings(postId, []);
  console.log(`[RuleWatch] Warnings cleared for post ${postId}`);
  return c.json<SaveWarningsResponse>({
    type: 'warnings_saved',
    warnings,
  });
});

api.get('/notes', async (c) => {
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

  const notes = await loadNotes(postId);
  return c.json<LoadNotesResponse>({
    type: 'notes',
    notes,
  });
});

api.post('/notes', async (c) => {
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

  const body = await c.req.json<SaveNotesRequest>();
  const notes = await saveNotes(postId, body.notes ?? []);

  return c.json<SaveNotesResponse>({
    type: 'notes_saved',
    notes,
  });
});

api.delete('/notes', async (c) => {
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
