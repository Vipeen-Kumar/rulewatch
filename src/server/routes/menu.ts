import { Hono } from 'hono';
import type { MenuItemRequest } from '@devvit/shared';
import type { UiResponse } from '@devvit/web/shared';
import { context } from '@devvit/web/server';
import { createPost } from '../core/post';
import { saveDashboardTarget } from '../core/storage';

export const menu = new Hono();

console.log('[RuleWatch] Menu routes initialized');

menu.post('/post-create', async (c) => {
  console.log('[RuleWatch] Menu action clicked: post-create');
  try {
    const post = await createPost();

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${post.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error creating post: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to create post',
      },
      400
    );
  }
});

menu.post('/open-rulewatch', async (c) => {
  console.log('[RuleWatch] Menu action clicked: open-rulewatch');
  try {
    const input = await c.req.json<MenuItemRequest>();
    const targetId = input.targetId;

    console.log('[RuleWatch] Menu action payload', {
      location: input.location,
      targetId,
    });

    if (!targetId || !targetId.startsWith('t3_')) {
      return c.json<UiResponse>(
        {
          showToast: 'RuleWatch can only open from a post.',
        },
        400
      );
    }

    const dashboardPost = await createPost(`RuleWatch: ${targetId}`);
    await saveDashboardTarget(dashboardPost.id, targetId);

    return c.json<UiResponse>(
      {
        navigateTo: `https://reddit.com/r/${context.subredditName}/comments/${dashboardPost.id}`,
      },
      200
    );
  } catch (error) {
    console.error(`Error opening RuleWatch: ${error}`);
    return c.json<UiResponse>(
      {
        showToast: 'Failed to open RuleWatch',
      },
      400
    );
  }
});
