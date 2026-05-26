import type { NoteEntry, PostScanResult, UserProfile, WarningEntry } from '../../shared/api';

type ModAssistantProps = {
  warnings: WarningEntry[];
  notes: NoteEntry[];
  profile: UserProfile | null;
  summary: string | null;
  scanResult: PostScanResult | null;
  scanLoading: boolean;
  scanError: string | null;
  onGenerateSummary: (summary: string) => void;
};

type Recommendation = {
  riskScore: number;
  confidence: number;
  action: 'No Action' | 'Watch User' | 'Send Warning' | 'Temporary Ban' | 'Permanent Ban';
  spamFrequency: number;
  toxicFrequency: number;
  activityScore: number;
  severityCounts: { low: number; medium: number; high: number };
};

const spamKeywords = [
  'free',
  'promo',
  'discount',
  'crypto',
  'giveaway',
  'airdrop',
  'dm',
  'link',
  'click',
  'subscribe',
];

const toxicKeywords = ['idiot', 'stupid', 'trash', 'hate', 'kill', 'die'];

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

const countKeywordHits = (text: string, keywords: string[]) => {
  const lowered = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    return lowered.includes(keyword) ? count + 1 : count;
  }, 0);
};

const getRecommendation = (
  warnings: WarningEntry[],
  notes: NoteEntry[],
  profile: UserProfile | null
): Recommendation => {
  const severityCounts = warnings.reduce(
    (counts, warning) => {
      if (warning.severity === 'High') counts.high += 1;
      if (warning.severity === 'Medium') counts.medium += 1;
      if (warning.severity === 'Low') counts.low += 1;
      return counts;
    },
    { low: 0, medium: 0, high: 0 }
  );

  const warningScore =
    warnings.length * 8 + severityCounts.high * 10 + severityCounts.medium * 6;

  const warningText = warnings.map((warning) => warning.reason).join(' ');
  let spamFrequency = countKeywordHits(warningText, spamKeywords);
  let toxicFrequency = countKeywordHits(warningText, toxicKeywords);

  const profileText = profile
    ? [
        ...profile.recentPosts.map((post) => post.title),
        ...profile.recentComments.map((comment) => comment.body),
      ].join(' ')
    : '';

  if (profileText) {
    spamFrequency += countKeywordHits(profileText, spamKeywords);
    toxicFrequency += countKeywordHits(profileText, toxicKeywords);
  }

  const accountAgeDays = profile
    ? Math.floor(
        (Date.now() - new Date(profile.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : 0;

  const karma = profile ? profile.totalKarma : 0;
  const activityItems = profile
    ? profile.recentPosts.length + profile.recentComments.length
    : 0;
  const subredditPresence = profile?.subredditPresence ?? [];
  const highRiskSubreddits = subredditPresence.filter(
    (entry) => entry.riskLevel === 'High'
  ).length;
  const mediumRiskSubreddits = subredditPresence.filter(
    (entry) => entry.riskLevel === 'Medium'
  ).length;
  const activityScore = clamp(
    activityItems * 12 + spamFrequency * 6 + highRiskSubreddits * 8 + mediumRiskSubreddits * 4
  );

  const agePenalty = accountAgeDays > 0 && accountAgeDays < 30 ? 12 : 0;
  const karmaPenalty = karma > 0 && karma < 100 ? 10 : 0;
  const spamPenalty = spamFrequency * 6;
  const toxicPenalty = toxicFrequency * 8;

  const rawScore =
    warningScore +
    agePenalty +
    karmaPenalty +
    spamPenalty +
    toxicPenalty +
    activityScore / 4 +
    highRiskSubreddits * 6 +
    mediumRiskSubreddits * 3;
  const riskScore = clamp(Math.round(rawScore));

  const confidenceBase = profile ? 65 : 50;
  const confidence = clamp(
    Math.round(
      confidenceBase +
        warnings.length * 3 +
        activityItems * 2 +
        highRiskSubreddits * 4 +
        mediumRiskSubreddits * 2
    )
  );

  let action: Recommendation['action'] = 'No Action';
  if (riskScore >= 80) action = 'Permanent Ban';
  else if (riskScore >= 65) action = 'Temporary Ban';
  else if (riskScore >= 50) action = 'Send Warning';
  else if (riskScore >= 30) action = 'Watch User';

  return {
    riskScore,
    confidence,
    action,
    spamFrequency,
    toxicFrequency,
    activityScore,
    severityCounts,
  };
};

const buildSummaryReport = (
  warnings: WarningEntry[],
  notes: NoteEntry[],
  profile: UserProfile | null,
  recommendation: Recommendation
) => {
  const presence = profile?.subredditPresence ?? [];
  const topCommunities = presence.slice(0, 3).map((entry) => {
    const label = `r/${entry.subredditName}`;
    return `${label} (${entry.activityCount})`;
  });
  const highRiskCommunities = presence.filter((entry) => entry.riskLevel === 'High');
  const cryptoPresence = presence.some((entry) =>
    entry.subredditName.toLowerCase().includes('crypto')
  );
  const riskCommunitySummary = highRiskCommunities.length
    ? `High-risk communities: ${highRiskCommunities
        .slice(0, 3)
        .map((entry) => `r/${entry.subredditName}`)
        .join(', ')}`
    : 'No high-risk communities detected.';
  const accountOverview = profile
    ? `User: u/${profile.username}\nAccount Age: ${profile.createdAt}\nKarma: ${profile.totalKarma}`
    : 'User profile not loaded.';

  const riskFindings = `Risk Score: ${recommendation.riskScore}/100\nConfidence: ${recommendation.confidence}%\nRecommended Action: ${recommendation.action}`;

  const suspiciousActivity = `Spam keyword hits: ${recommendation.spamFrequency}\nToxic keyword hits: ${recommendation.toxicFrequency}\nRecent activity score: ${recommendation.activityScore}/100`;

  const presenceSummary = presence.length
    ? [
        `Top communities: ${topCommunities.join(', ')}`,
        `Unique communities: ${presence.length}`,
        riskCommunitySummary,
        cryptoPresence
          ? 'User frequently participates in crypto promotion subreddits.'
          : null,
      ]
        .filter(Boolean)
        .join('\n')
    : 'No subreddit presence data available.';

  const warningSummary = warnings.length
    ? warnings
        .map((warning) => `${warning.timestamp} - ${warning.severity} - ${warning.reason}`)
        .join('\n')
    : 'No warnings on file.';

  const noteSummary = notes.length
    ? notes.map((note) => `${note.timestamp} - ${note.note}`).join('\n')
    : 'No moderator notes.';

  return [
    'Account Overview',
    accountOverview,
    '',
    'Risk Findings',
    riskFindings,
    '',
    'Subreddit Presence',
    presenceSummary,
    '',
    'Suspicious Activity',
    suspiciousActivity,
    '',
    'Warning History',
    warningSummary,
    '',
    'Moderator Notes',
    noteSummary,
    '',
    'Recommended Action',
    recommendation.action,
  ].join('\n');
};

export const createModSummary = (
  warnings: WarningEntry[],
  notes: NoteEntry[],
  profile: UserProfile | null
) => {
  const recommendation = getRecommendation(warnings, notes, profile);
  return buildSummaryReport(warnings, notes, profile, recommendation);
};

export const ModAssistant = ({
  warnings,
  notes,
  profile,
  summary,
  scanResult,
  scanLoading,
  scanError,
  onGenerateSummary,
}: ModAssistantProps) => {
  const recommendation = getRecommendation(warnings, notes, profile);
  const totalSeverity =
    recommendation.severityCounts.low +
    recommendation.severityCounts.medium +
    recommendation.severityCounts.high;
  const lowPercent = totalSeverity
    ? (recommendation.severityCounts.low / totalSeverity) * 100
    : 0;
  const mediumPercent = totalSeverity
    ? (recommendation.severityCounts.medium / totalSeverity) * 100
    : 0;
  const highPercent = totalSeverity
    ? (recommendation.severityCounts.high / totalSeverity) * 100
    : 0;

  const pieStyle = {
    background: `conic-gradient(#22c55e ${lowPercent}%, #eab308 ${
      lowPercent + mediumPercent
    }%, #ef4444 ${lowPercent + mediumPercent + highPercent}%)`,
  } as const;

  const riskWidth = `${recommendation.riskScore}%`;
  const activityWidth = `${recommendation.activityScore}%`;

  const handleGenerateSummary = () => {
    const report = buildSummaryReport(warnings, notes, profile, recommendation);
    onGenerateSummary(report);
  };

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur">
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold">AI Moderation Assistant</h2>
        <p className="text-sm text-zinc-400">
          Automated recommendations based on case activity and account signals.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 transition transform hover:-translate-y-0.5 hover:border-zinc-500/60">
          <p className="text-xs text-zinc-400">Risk Score</p>
          <p className="text-2xl font-semibold">{recommendation.riskScore}</p>
          <p className="text-xs text-zinc-400">Confidence {recommendation.confidence}%</p>
        </div>
        <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 transition transform hover:-translate-y-0.5 hover:border-zinc-500/60">
          <p className="text-xs text-zinc-400">Recommended Action</p>
          <p className="text-lg font-semibold">{recommendation.action}</p>
        </div>
        <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 transition transform hover:-translate-y-0.5 hover:border-zinc-500/60">
          <p className="text-xs text-zinc-400">Warnings Logged</p>
          <p className="text-2xl font-semibold">{warnings.length}</p>
          <p className="text-xs text-zinc-400">Notes {notes.length}</p>
        </div>
        <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 transition transform hover:-translate-y-0.5 hover:border-zinc-500/60">
          <p className="text-xs text-zinc-400">Activity Heat</p>
          <p className="text-2xl font-semibold">{recommendation.activityScore}</p>
          <p className="text-xs text-zinc-400">Heat score</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 space-y-4 transition transform hover:-translate-y-0.5 hover:border-zinc-500/60">
          <h3 className="text-lg font-semibold">Warning Severity Mix</h3>
          <div className="flex items-center gap-4">
            <div className="w-28 h-28 rounded-full" style={pieStyle} />
            <div className="space-y-2 text-sm">
              <p className="text-green-300">Low: {recommendation.severityCounts.low}</p>
              <p className="text-yellow-300">Medium: {recommendation.severityCounts.medium}</p>
              <p className="text-red-300">High: {recommendation.severityCounts.high}</p>
            </div>
          </div>
        </div>

        <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 space-y-4 transition transform hover:-translate-y-0.5 hover:border-zinc-500/60">
          <h3 className="text-lg font-semibold">Risk Meter</h3>
          <div>
            <div className="flex items-center justify-between text-sm text-zinc-300 mb-2">
              <span>Risk Score</span>
              <span>{recommendation.riskScore}/100</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-red-500" style={{ width: riskWidth }} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-sm text-zinc-300 mb-2">
              <span>Activity Heat</span>
              <span>{recommendation.activityScore}/100</span>
            </div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-yellow-500" style={{ width: activityWidth }} />
            </div>
          </div>
          <div className="text-xs text-zinc-400">
            Spam hits: {recommendation.spamFrequency} · Toxic hits: {recommendation.toxicFrequency}
          </div>
        </div>
      </div>

      <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 space-y-4 transition transform hover:-translate-y-0.5 hover:border-zinc-500/60">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Latest Post Scan</h3>
          <span className="text-xs text-zinc-400">Auto</span>
        </div>
        {scanLoading ? (
          <p className="text-sm text-zinc-400">Loading scan results...</p>
        ) : scanError ? (
          <p className="text-sm text-red-300">{scanError}</p>
        ) : scanResult ? (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3 text-sm">
              <div>
                <p className="text-xs text-zinc-400">Risk Score</p>
                <p className="text-lg font-semibold">{scanResult.riskScore}</p>
                <p className="text-xs text-zinc-400">
                  Confidence {scanResult.confidence}%
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Recommended Action</p>
                <p className="text-sm font-semibold">{scanResult.recommendedAction}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Signals</p>
                <p className="text-xs text-zinc-200">
                  {scanResult.postingFrequency} posts/24h · {scanResult.accountAgeDays}d age ·
                  {` ${scanResult.karma}`} karma
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {scanResult.flags.length ? (
                scanResult.flags.map((flag) => (
                  <span
                    key={flag}
                    className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-200 border border-red-500/40"
                  >
                    {flag.replace('_', ' ')}
                  </span>
                ))
              ) : (
                <span className="text-xs text-zinc-400">No flagged categories</span>
              )}
            </div>
            <p className="text-sm text-zinc-200">{scanResult.summary}</p>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No scan results stored for this post.</p>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <button
          className="bg-indigo-500/80 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl font-semibold transition"
          onClick={handleGenerateSummary}
        >
          Generate Mod Summary
        </button>

        {summary ? (
          <div className="bg-zinc-800/80 rounded-xl p-4 border border-zinc-700 whitespace-pre-wrap text-sm text-zinc-200">
            {summary}
          </div>
        ) : null}
      </div>
    </div>
  );
};
