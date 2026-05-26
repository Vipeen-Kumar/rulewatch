import type { PostScanResult, ScanFlag, ScanRecommendedAction } from '../../shared/api';

type ScanInput = {
  postId: string;
  title: string;
  body: string;
  author: string;
  subreddit: string;
  createdAt: number;
  accountAgeDays: number;
  karma: number;
  postingFrequency: number;
};

const spamKeywords = [
  'free',
  'giveaway',
  'click',
  'subscribe',
  'bit.ly',
  'earn',
  'work from home',
  'dm me',
  'telegram',
  'whatsapp',
];

const scamKeywords = [
  'crypto',
  'wallet',
  'investment',
  'airdrop',
  'guaranteed',
  'refund',
  'chargeback',
  'seed phrase',
  'verify account',
  'unlock',
];

const toxicityKeywords = [
  'idiot',
  'stupid',
  'moron',
  'trash',
  'kys',
  'kill yourself',
  'hate you',
  'loser',
];

const harassmentKeywords = [
  'dox',
  'expose',
  'leak',
  'address',
  'phone number',
  'stalking',
  'harass',
  'target',
  'brigade',
];

const nsfwKeywords = ['onlyfans', 'nude', 'porn', 'xxx', 'nsfw', 'lewd', 'sex'];

const promoKeywords = [
  'discount',
  'promo',
  'sale',
  'limited offer',
  'buy now',
  'shop',
  'store',
  'link in bio',
  'sponsored',
];

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const countOccurrences = (text: string, keyword: string) => {
  if (!keyword) {
    return 0;
  }
  const escaped = escapeRegExp(keyword);
  const pattern = keyword.includes(' ') ? escaped : `\\b${escaped}\\b`;
  const matches = text.match(new RegExp(pattern, 'g'));
  return matches ? matches.length : 0;
};

const countKeywordHits = (text: string, keywords: string[]) =>
  keywords.reduce((total, keyword) => total + countOccurrences(text, keyword), 0);

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

const getRecommendedAction = (riskScore: number): ScanRecommendedAction => {
  if (riskScore >= 80) {
    return 'Permanent Ban';
  }
  if (riskScore >= 60) {
    return 'Temporary Ban';
  }
  if (riskScore >= 45) {
    return 'Send Warning';
  }
  if (riskScore >= 25) {
    return 'Watch User';
  }
  return 'No Action';
};

const buildSummary = (flags: ScanFlag[], riskScore: number, postingFrequency: number) => {
  if (flags.length === 0) {
    return `No high-risk indicators detected. Risk score ${riskScore}.`;
  }
  const flagList = flags.join(', ');
  const frequencyNote = postingFrequency > 0 ? ` Recent posting frequency ${postingFrequency} in 24h.` : '';
  return `Flagged ${flagList}. Risk score ${riskScore}.${frequencyNote}`;
};

export const buildPostScanResult = (input: ScanInput): PostScanResult => {
  const combined = `${input.title} ${input.body}`.toLowerCase();
  const spam = countKeywordHits(combined, spamKeywords);
  const scam = countKeywordHits(combined, scamKeywords);
  const toxicity = countKeywordHits(combined, toxicityKeywords);
  const harassment = countKeywordHits(combined, harassmentKeywords);
  const nsfw = countKeywordHits(combined, nsfwKeywords);
  const promotion = countKeywordHits(combined, promoKeywords);

  const flags: ScanFlag[] = [];
  if (spam > 0) flags.push('spam');
  if (scam > 0) flags.push('scam');
  if (toxicity > 0) flags.push('toxicity');
  if (harassment > 0) flags.push('harassment');
  if (nsfw > 0) flags.push('nsfw_bait');
  if (promotion > 0) flags.push('promotion');

  const baseRisk = spam * 8 + scam * 12 + toxicity * 10 + harassment * 10 + nsfw * 6 + promotion * 6;
  const frequencyRisk = input.postingFrequency * 4;
  const accountRisk = input.accountAgeDays < 30 ? 10 : input.accountAgeDays < 90 ? 5 : 0;
  const karmaRisk = input.karma < 100 ? 8 : input.karma < 500 ? 4 : 0;

  const riskScore = clamp(baseRisk + frequencyRisk + accountRisk + karmaRisk, 0, 100);

  const confidenceBoost =
    Math.min(45, (spam + scam + toxicity + harassment + nsfw + promotion) * 5) +
    Math.min(10, input.postingFrequency * 2) +
    (input.accountAgeDays < 30 ? 5 : 0) +
    (input.karma < 100 ? 5 : 0);
  const confidence = clamp(45 + confidenceBoost, 0, 100);

  const recommendedAction = getRecommendedAction(riskScore);
  const summary = buildSummary(flags, riskScore, input.postingFrequency);

  return {
    postId: input.postId,
    title: input.title,
    body: input.body,
    author: input.author,
    subreddit: input.subreddit,
    createdAt: new Date(input.createdAt * 1000).toISOString(),
    riskScore,
    confidence,
    recommendedAction,
    summary,
    flags,
    keywordHits: {
      spam,
      scam,
      toxicity,
      harassment,
      nsfw,
      promotion,
    },
    accountAgeDays: input.accountAgeDays,
    karma: input.karma,
    postingFrequency: input.postingFrequency,
  };
};
