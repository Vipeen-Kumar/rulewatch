import type { RiskLevel, SubredditPresence } from '../../shared/api';

type SubredditPresenceProps = {
  presence: SubredditPresence[];
};

const riskStyles: Record<RiskLevel, string> = {
  Low: 'bg-green-500/15 text-green-200 border-green-500/40',
  Medium: 'bg-yellow-500/15 text-yellow-200 border-yellow-500/40',
  High: 'bg-red-500/15 text-red-200 border-red-500/40',
};

export const SubredditPresenceCard = ({ presence }: SubredditPresenceProps) => {
  const topPresence = presence.slice(0, 5);
  const highRiskCount = presence.filter((entry) => entry.riskLevel === 'High').length;
  const mostActive = topPresence[0];

  return (
    <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Subreddit Presence</h3>
          <p className="text-xs text-zinc-400">
            {presence.length} unique communities detected.
          </p>
        </div>
        {mostActive ? (
          <span className="text-[11px] uppercase tracking-wide bg-blue-500/20 text-blue-200 border border-blue-500/40 px-2 py-1 rounded-full">
            Most Active Community
          </span>
        ) : null}
      </div>

      {topPresence.length === 0 ? (
        <p className="text-sm text-zinc-400">No recent subreddit activity found.</p>
      ) : (
        <ul className="space-y-3">
          {topPresence.map((entry, index) => (
            <li
              key={entry.subredditName}
              className="border border-zinc-700 rounded-lg p-3 bg-zinc-900/40 transition hover:border-zinc-500/60"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">
                    r/{entry.subredditName}
                  </span>
                  {index === 0 ? (
                    <span className="text-[10px] uppercase tracking-wide bg-blue-500/20 text-blue-200 border border-blue-500/40 px-2 py-0.5 rounded-full">
                      Most Active
                    </span>
                  ) : null}
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border ${
                    riskStyles[entry.riskLevel]
                  }`}
                >
                  {entry.riskLevel} Risk
                </span>
              </div>
              <div className="mt-2 text-sm text-zinc-200">
                <span className="text-lg font-semibold">{entry.activityCount}</span>{' '}
                activities
              </div>
              <div className="text-xs text-zinc-400">
                {entry.posts} posts | {entry.comments} comments
              </div>
            </li>
          ))}
        </ul>
      )}

      {highRiskCount >= 2 ? (
        <div className="text-xs text-red-200 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          User active in multiple high-risk promo communities.
        </div>
      ) : highRiskCount === 1 ? (
        <div className="text-xs text-yellow-200 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-3 py-2">
          User participates in at least one high-risk promo community.
        </div>
      ) : null}
    </div>
  );
};
