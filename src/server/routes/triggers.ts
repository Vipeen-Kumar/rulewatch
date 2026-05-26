import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnPostCreateRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import { context, reddit } from '@devvit/web/server';
import { createPost } from '../core/post';
import { buildPostScanResult } from '../core/scan';
import { appendTimelineEvent, saveScanResult } from '../core/storage';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  try {
    const post = await createPost();
    const input = await c.req.json<OnAppInstallRequest>();

    return c.json<TriggerResponse>(
      {
        status: 'success',
        message: `Post created in subreddit ${context.subredditName} with id ${post.id} (trigger: ${input.type})`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to create post',
      },
      400
    );
  }
});

triggers.post('/on-post-create', async (c) => {
  console.log('[RuleWatch] on-post-create trigger invoked');
  const input = await c.req.json<OnPostCreateRequest>();
  console.log('[RuleWatch] on-post-create payload type', input.type);
  const post = input.post;

  if (!post) {
    console.warn('[RuleWatch] on-post-create missing post payload');
    return c.json<TriggerResponse>({ status: 'success', message: 'No post payload' }, 200);
  }

  console.log('[RuleWatch] on-post-create post received', {
    id: post.id,
    title: post.title,
    bodyLength: post.selftext?.length ?? 0,
    createdAt: post.createdAt,
  });

  const authorName = input.author?.name ?? 'unknown';
  const subredditName = input.subreddit?.name ?? context.subredditName ?? 'unknown';
  console.log('[RuleWatch] on-post-create author/subreddit', {
    authorName,
    subredditName,
  });

  let accountAgeDays = 0;
  let karma = 0;
  let postingFrequency = 0;

  if (authorName !== 'unknown') {
    try {
      console.log('[RuleWatch] scan enrichment start', authorName);
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
      console.log('[RuleWatch] scan enrichment complete', {
        accountAgeDays,
        karma,
        postingFrequency,
      });
    } catch (error) {
      console.warn(`[RuleWatch] scan enrichment failed: ${error}`);
    }
  }

  console.log('[RuleWatch] scan generation start', post.id);
  const result = buildPostScanResult({
    postId: post.id,
    title: post.title,
    body: post.selftext ?? '',
    author: authorName,
    subreddit: subredditName,
    createdAt: post.createdAt || Math.floor(Date.now() / 1000),
    accountAgeDays,
    karma,
    postingFrequency,
  });
  console.log('[RuleWatch] scan generation complete', {
    postId: result.postId,
    riskScore: result.riskScore,
    confidence: result.confidence,
    flags: result.flags,
  });

  try {
    await saveScanResult(post.id, result);
    console.log('[RuleWatch] scan saved to KV', post.id);
  } catch (error) {
    console.error('[RuleWatch] scan save failed', error);
    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: `Scan save failed for post ${post.id}`,
      },
      500
    );
  }

  await appendTimelineEvent(post.id, {
    id: `scan-${post.id}-${Date.now()}`,
    type: 'scan_completed',
    timestamp: new Date().toISOString(),
    message: `Auto scan completed. Risk ${result.riskScore} (${result.recommendedAction}).`,
    actor: 'RuleWatch AI',
  });
  console.log('[RuleWatch] scan timeline event appended', post.id);

  return c.json<TriggerResponse>(
    {
      status: 'success',
      message: `Scan completed for post ${post.id} in ${subredditName}`,
    },
    200
  );
});
