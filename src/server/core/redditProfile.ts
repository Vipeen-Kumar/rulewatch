import { reddit } from '@devvit/web/server';
import type {
  RecentComment,
  RecentPost,
  RiskLevel,
  UserProfile,
  UserRiskAnalysis,
} from '../../shared/api';

const spamKeywords = [
  'free',
  'promo',
  'discount',
  'crypto',
  'giveaway',
  'airdrop',
  'dm',
  'link',
];

const toxicKeywords = ['idiot', 'stupid', 'trash', 'hate', 'kill'];

const normalizeUsername = (username: string) =>
  username.replace(/^u\//i, '').trim();

const textIncludesKeyword = (text: string, keyword: string) =>
  text.includes(keyword);

const countKeywordHits = (text: string, keywords: string[]) => {
  const lowered = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    if (textIncludesKeyword(lowered, keyword)) {
      return count + 1;
    }
    return count;
  }, 0);
};

const toRecentPost = (post: {
  id: string;
  title: string;
  createdAt: Date;
  permalink: string;
  subredditName: string;
  score: number;
  removed: boolean;
  spam: boolean;
}): RecentPost => ({
  id: post.id,
  title: post.title,
  createdAt: post.createdAt.toISOString(),
  permalink: post.permalink,
  subredditName: post.subredditName,
  score: post.score,
  removed: post.removed,
  spam: post.spam,
});

const toRecentComment = (comment: {
  id: string;
  body: string;
  createdAt: Date;
  permalink: string;
  subredditName: string;
  score: number;
  removed: boolean;
  spam: boolean;
}): RecentComment => ({
  id: comment.id,
  body: comment.body,
  createdAt: comment.createdAt.toISOString(),
  permalink: comment.permalink,
  subredditName: comment.subredditName,
  score: comment.score,
  removed: comment.removed,
  spam: comment.spam,
});

// Basic heuristic scoring using recent content only.
const buildRiskAnalysis = (
  posts: RecentPost[],
  comments: RecentComment[]
): UserRiskAnalysis => {
  let spamPostCount = 0;
  let toxicHits = 0;

  posts.forEach((post) => {
    const content = `${post.title} ${post.subredditName}`.toLowerCase();
    spamPostCount += countKeywordHits(content, spamKeywords) > 0 ? 1 : 0;
    toxicHits += countKeywordHits(content, toxicKeywords);
  });

  comments.forEach((comment) => {
    const content = comment.body.toLowerCase();
    spamPostCount += countKeywordHits(content, spamKeywords) > 0 ? 1 : 0;
    toxicHits += countKeywordHits(content, toxicKeywords);
  });

  const now = Date.now();
  const recentActivityCount = [...posts, ...comments].filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();
    return now - createdAt <= 24 * 60 * 60 * 1000;
  }).length;

  const spamRisk: RiskLevel =
    spamPostCount >= 3 || recentActivityCount >= 10
      ? 'High'
      : spamPostCount >= 1 || recentActivityCount >= 6
      ? 'Medium'
      : 'Low';

  const harassmentRisk: RiskLevel =
    toxicHits >= 3 ? 'High' : toxicHits >= 1 ? 'Medium' : 'Low';

  const suspiciousPatterns: string[] = [];
  if (spamPostCount >= 2) {
    suspiciousPatterns.push('Repeated spam-like posts or comments detected.');
  }
  if (recentActivityCount >= 6) {
    suspiciousPatterns.push('Excessive posting volume in the last 24 hours.');
  }
  if (toxicHits >= 1) {
    suspiciousPatterns.push('Toxic keywords detected in recent activity.');
  }

  const banRecommendation =
    spamRisk === 'High' || harassmentRisk === 'High'
      ? 'Permanent'
      : spamRisk === 'Medium' || harassmentRisk === 'Medium'
      ? 'Temporary'
      : 'None';

  return {
    spamRisk,
    harassmentRisk,
    banRecommendation,
    suspiciousPatterns,
  };
};

// Fetches user data and recent activity in a single helper.
export const fetchUserProfile = async (
  rawUsername: string,
  limit = 5
): Promise<UserProfile> => {
  const username = normalizeUsername(rawUsername);

  const user = await reddit.getUserByUsername(username);
  if (!user) {
    throw new Error('User not found');
  }

  const [postListing, commentListing] = await Promise.all([
    reddit.getPostsByUser({ username, sort: 'new', limit, pageSize: limit }),
    reddit.getCommentsByUser({ username, sort: 'new', limit, pageSize: limit }),
  ]);

  const [posts, comments] = await Promise.all([
    postListing.get(limit),
    commentListing.get(limit),
  ]);

  const recentPosts = posts.map((post) =>
    toRecentPost({
      id: post.id,
      title: post.title,
      createdAt: post.createdAt,
      permalink: post.permalink,
      subredditName: post.subredditName,
      score: post.score,
      removed: post.removed,
      spam: post.spam,
    })
  );

  const recentComments = comments.map((comment) =>
    toRecentComment({
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      permalink: comment.permalink,
      subredditName: comment.subredditName,
      score: comment.score,
      removed: comment.removed,
      spam: comment.spam,
    })
  );

  const risk = buildRiskAnalysis(recentPosts, recentComments);

  return {
    username: user.username,
    createdAt: user.createdAt.toISOString(),
    linkKarma: user.linkKarma,
    commentKarma: user.commentKarma,
    totalKarma: user.linkKarma + user.commentKarma,
    recentPosts,
    recentComments,
    risk,
  };
};
