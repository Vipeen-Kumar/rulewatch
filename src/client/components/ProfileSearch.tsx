import { useEffect, useRef, type FormEvent } from 'react';
import type { UserProfile } from '../../shared/api';
import { useUserAutocomplete } from '../hooks/useUserAutocomplete';
import { SubredditPresenceCard } from './SubredditPresence';

type ProfileSearchProps = {
  usernameInput: string;
  onUsernameChange: (value: string) => void;
  onSearch: (event: FormEvent<HTMLFormElement>) => void;
  onSelectUsername: (username: string) => void;
  isLoading: boolean;
  autoLoading: boolean;
  autoError: string | null;
  error: string | null;
  profile: UserProfile | null;
  formatTimestamp: (value: string) => string;
  getAccountAgeLabel: (createdAt: string) => string;
};

export const ProfileSearch = ({
  usernameInput,
  onUsernameChange,
  onSearch,
  onSelectUsername,
  isLoading,
  autoLoading,
  autoError,
  error,
  profile,
  formatTimestamp,
  getAccountAgeLabel,
}: ProfileSearchProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    suggestions,
    isOpen,
    isLoading: isSuggesting,
    activeIndex,
    setActiveIndex,
    setIsOpen,
  } = useUserAutocomplete({ query: usernameInput });

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => {
      document.removeEventListener('mousedown', handleClick);
    };
  }, [setActiveIndex, setIsOpen]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      setIsOpen(true);
    }

    if (!isOpen) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextIndex = suggestions.length
        ? (activeIndex + 1) % suggestions.length
        : -1;
      setActiveIndex(nextIndex);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!suggestions.length) {
        setActiveIndex(-1);
        return;
      }
      const nextIndex = activeIndex <= 0 ? suggestions.length - 1 : activeIndex - 1;
      setActiveIndex(nextIndex);
      return;
    }

    if (event.key === 'Enter') {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        event.preventDefault();
        const selected = suggestions[activeIndex];
        onSelectUsername(selected.username);
        setIsOpen(false);
        setActiveIndex(-1);
      }
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const handleSelect = (username: string) => {
    onSelectUsername(username);
    setIsOpen(false);
    setActiveIndex(-1);
  };
  const riskStyles: Record<string, string> = {
    Low: 'bg-green-500/20 text-green-300 border-green-500/40',
    Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
    High: 'bg-red-500/20 text-red-300 border-red-500/40',
  };

  const banStyles: Record<string, string> = {
    None: 'bg-zinc-700/30 text-zinc-200 border-zinc-600',
    Temporary: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
    Permanent: 'bg-red-500/20 text-red-200 border-red-500/40',
  };

  return (
    <div
      className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-2xl p-6 space-y-4 backdrop-blur"
      ref={containerRef}
    >
      <div>
        <h2 className="text-2xl font-semibold">Moderation Profile</h2>
        <p className="text-sm text-zinc-400">
          RuleWatch auto-loads the current post author. Manual search is optional.
        </p>
      </div>

      {autoLoading ? (
        <div className="text-sm text-zinc-300">
          Auto-loading current post author...
        </div>
      ) : null}

      {autoError ? (
        <p className="text-sm text-yellow-300">
          Auto-load failed. Use manual search to continue.
        </p>
      ) : null}

      <form className="flex flex-col sm:flex-row gap-3" onSubmit={onSearch}>
        <div className="relative flex-1">
          <input
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter username (without u/)"
            value={usernameInput}
            onChange={(event) => {
              onUsernameChange(event.target.value);
              if (event.target.value.trim().length === 0) {
                setIsOpen(false);
                setActiveIndex(-1);
              } else {
                setIsOpen(true);
              }
            }}
            onKeyDown={handleKeyDown}
          />
          {isOpen && usernameInput.trim().length > 0 ? (
            <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-950 shadow-lg overflow-hidden">
              {isSuggesting ? (
                <div className="flex items-center gap-2 px-4 py-3 text-sm text-zinc-400">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-transparent" />
                  Searching users...
                </div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-zinc-500">No users found</div>
              ) : (
                <ul className="max-h-56 overflow-auto">
                  {suggestions.map((suggestion, index) => {
                    const isActive = index === activeIndex;
                    return (
                      <li key={suggestion.username}>
                        <button
                          type="button"
                          className={`w-full text-left px-4 py-2 text-sm transition ${
                            isActive
                              ? 'bg-zinc-800 text-white'
                              : 'text-zinc-200 hover:bg-zinc-900'
                          }`}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelect(suggestion.username)}
                        >
                          <div className="flex items-center justify-between">
                            <span>u/{suggestion.username}</span>
                            {suggestion.karma || suggestion.accountAgeDays ? (
                              <span className="text-xs text-zinc-400">
                                {typeof suggestion.karma === 'number'
                                  ? `${suggestion.karma} karma`
                                  : ''}
                                {typeof suggestion.karma === 'number' &&
                                typeof suggestion.accountAgeDays === 'number'
                                  ? ' · '
                                  : ''}
                                {typeof suggestion.accountAgeDays === 'number'
                                  ? `${suggestion.accountAgeDays}d`
                                  : ''}
                              </span>
                            ) : null}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
        <button
          className="bg-blue-500 px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Search'}
        </button>
      </form>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      {autoLoading && !profile ? (
        <div className="space-y-4 animate-pulse">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-20 rounded-xl bg-zinc-800/70 border border-zinc-700" />
            <div className="h-20 rounded-xl bg-zinc-800/70 border border-zinc-700" />
            <div className="h-20 rounded-xl bg-zinc-800/70 border border-zinc-700" />
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="h-56 rounded-xl bg-zinc-800/70 border border-zinc-700" />
            <div className="h-56 rounded-xl bg-zinc-800/70 border border-zinc-700" />
          </div>
          <div className="h-48 rounded-xl bg-zinc-800/70 border border-zinc-700" />
        </div>
      ) : profile ? (
        <div className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <p className="text-sm text-zinc-400">Username</p>
              <p className="text-lg font-semibold">u/{profile.username}</p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <p className="text-sm text-zinc-400">Account Age</p>
              <p className="text-lg font-semibold">
                {getAccountAgeLabel(profile.createdAt)}
              </p>
            </div>
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700">
              <p className="text-sm text-zinc-400">Total Karma</p>
              <p className="text-lg font-semibold">{profile.totalKarma}</p>
              <p className="text-xs text-zinc-400">
                Link {profile.linkKarma} · Comment {profile.commentKarma}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
            <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 space-y-3">
              <h3 className="text-lg font-semibold">Risk Analysis</h3>
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1 rounded-full text-xs border ${riskStyles[profile.risk.spamRisk] || riskStyles.Low}`}>
                  Spam Risk: {profile.risk.spamRisk}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs border ${riskStyles[profile.risk.harassmentRisk] || riskStyles.Low}`}>
                  Harassment Risk: {profile.risk.harassmentRisk}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs border ${banStyles[profile.risk.banRecommendation] || banStyles.None}`}>
                  Ban: {profile.risk.banRecommendation}
                </span>
              </div>
              <div>
                <p className="text-sm text-zinc-300 mb-2">Suspicious patterns</p>
                {profile.risk.suspiciousPatterns.length === 0 ? (
                  <p className="text-sm text-zinc-400">
                    No suspicious patterns detected.
                  </p>
                ) : (
                  <ul className="space-y-1 text-sm text-zinc-200">
                    {profile.risk.suspiciousPatterns.map((pattern) => (
                      <li key={pattern}>{pattern}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <SubredditPresenceCard presence={profile.subredditPresence ?? []} />
          </div>

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
      ) : (
        <p className="text-sm text-zinc-500">
          No profile loaded yet. Search a username to begin.
        </p>
      )}
    </div>
  );
};
