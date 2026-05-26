import type { UserProfile } from '../../shared/api';

type RecentActivityProps = {
  profile: UserProfile | null;
  formatTimestamp: (value: string) => string;
};

export const RecentActivity = ({ profile, formatTimestamp }: RecentActivityProps) => {
  if (!profile) {
    return <p className="text-xs text-zinc-400 sm:text-sm">No profile loaded yet.</p>;
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="bg-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-zinc-700 space-y-2 sm:space-y-3">
        <h3 className="text-base font-semibold sm:text-lg">Recent Posts</h3>
        {profile.recentPosts.length === 0 ? (
          <p className="text-xs text-zinc-400 sm:text-sm">No recent posts found.</p>
        ) : (
          <ul className="space-y-2">
            {profile.recentPosts.map((post) => (
              <li
                key={post.id}
                className="border border-zinc-700 rounded-lg p-2.5 sm:p-3"
              >
                <p className="text-xs font-semibold sm:text-sm">{post.title}</p>
                <p className="text-[10px] text-zinc-400 sm:text-xs">
                  r/{post.subredditName} · {formatTimestamp(post.createdAt)}
                </p>
                <p className="text-[10px] text-zinc-400 sm:text-xs">
                  Score: {post.score}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="bg-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-zinc-700 space-y-2 sm:space-y-3">
        <h3 className="text-base font-semibold sm:text-lg">Recent Comments</h3>
        {profile.recentComments.length === 0 ? (
          <p className="text-xs text-zinc-400 sm:text-sm">No recent comments found.</p>
        ) : (
          <ul className="space-y-2">
            {profile.recentComments.map((comment) => (
              <li
                key={comment.id}
                className="border border-zinc-700 rounded-lg p-2.5 sm:p-3"
              >
                <p className="text-xs sm:text-sm">
                  {comment.body.length > 160
                    ? `${comment.body.slice(0, 160)}...`
                    : comment.body}
                </p>
                <p className="text-[10px] text-zinc-400 sm:text-xs">
                  r/{comment.subredditName} · {formatTimestamp(comment.createdAt)}
                </p>
                <p className="text-[10px] text-zinc-400 sm:text-xs">
                  Score: {comment.score}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
