import type { UserProfile } from '../../shared/api';

type RecentActivityProps = {
  profile: UserProfile | null;
  formatTimestamp: (value: string) => string;
};

export const RecentActivity = ({ profile, formatTimestamp }: RecentActivityProps) => {
  if (!profile) {
    return <p className="text-sm text-zinc-400">No profile loaded yet.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 space-y-3">
        <h3 className="text-lg font-semibold">Recent Posts</h3>
        {profile.recentPosts.length === 0 ? (
          <p className="text-sm text-zinc-400">No recent posts found.</p>
        ) : (
          <ul className="space-y-2">
            {profile.recentPosts.map((post) => (
              <li
                key={post.id}
                className="border border-zinc-700 rounded-lg p-3"
              >
                <p className="text-sm font-semibold">{post.title}</p>
                <p className="text-xs text-zinc-400">
                  r/{post.subredditName} · {formatTimestamp(post.createdAt)}
                </p>
                <p className="text-xs text-zinc-400">Score: {post.score}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 space-y-3">
        <h3 className="text-lg font-semibold">Recent Comments</h3>
        {profile.recentComments.length === 0 ? (
          <p className="text-sm text-zinc-400">No recent comments found.</p>
        ) : (
          <ul className="space-y-2">
            {profile.recentComments.map((comment) => (
              <li
                key={comment.id}
                className="border border-zinc-700 rounded-lg p-3"
              >
                <p className="text-sm">
                  {comment.body.length > 160
                    ? `${comment.body.slice(0, 160)}...`
                    : comment.body}
                </p>
                <p className="text-xs text-zinc-400">
                  r/{comment.subredditName} · {formatTimestamp(comment.createdAt)}
                </p>
                <p className="text-xs text-zinc-400">Score: {comment.score}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
