import './index.css';

import { StrictMode, useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  RiskLevel,
  LoadNotesResponse,
  LoadWarningsResponse,
  NoteEntry,
  SaveNotesRequest,
  SaveWarningsRequest,
  Severity,
  UserProfile,
  UserProfileResponse,
  WarningEntry,
} from '../shared/api';

type TimelineItem =
  | (WarningEntry & { type: 'warning' })
  | (NoteEntry & { type: 'note' });

const moderatorName = 'u/VipeenKumar';

const severityOptions: Severity[] = ['Low', 'Medium', 'High'];

const severityStyles: Record<Severity, string> = {
  Low: 'bg-green-500/20 text-green-300 border-green-500/40',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  High: 'bg-red-500/20 text-red-300 border-red-500/40',
};

const presetReasons = [
  'Spam',
  'Harassment',
  'Hate Speech',
  'Low Effort',
  'NSFW Violation',
];


const loadWarningsFromApi = async () => {
  console.log('[RuleWatch] Loading warnings from API');
  const response = await fetch('/api/warnings');
  if (!response.ok) {
    throw new Error('Failed to load warnings');
  }
  const data = (await response.json()) as LoadWarningsResponse;
  console.log('[RuleWatch] Loaded warnings count', data.warnings?.length ?? 0);
  return data.warnings ?? [];
};

const saveWarningsToApi = async (warnings: WarningEntry[]) => {
  const payload: SaveWarningsRequest = { warnings };
  await fetch('/api/warnings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

const loadNotesFromApi = async () => {
  console.log('[RuleWatch] Loading notes from API');
  const response = await fetch('/api/notes');
  if (!response.ok) {
    throw new Error('Failed to load notes');
  }
  const data = (await response.json()) as LoadNotesResponse;
  console.log('[RuleWatch] Loaded notes count', data.notes?.length ?? 0);
  return data.notes ?? [];
};

const saveNotesToApi = async (notes: NoteEntry[]) => {
  const payload: SaveNotesRequest = { notes };
  await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

const clearWarningsFromApi = async () => {
  console.log('[RuleWatch] Clearing warnings via API');
  const response = await fetch('/api/warnings', { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Failed to clear warnings');
  }
};

const clearNotesFromApi = async () => {
  console.log('[RuleWatch] Clearing notes via API');
  const response = await fetch('/api/notes', { method: 'DELETE' });
  if (!response.ok) {
    throw new Error('Failed to clear notes');
  }
};

const loadUserProfileFromApi = async (username: string) => {
  const response = await fetch(
    `/api/user-profile?username=${encodeURIComponent(username)}`
  );
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.message === 'string'
        ? errorBody.message
        : 'Failed to load user profile';
    throw new Error(message);
  }
  const data = (await response.json()) as UserProfileResponse;
  return data.profile;
};

const riskBadgeStyles: Record<RiskLevel, string> = {
  Low: 'bg-green-500/20 text-green-300 border-green-500/40',
  Medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  High: 'bg-red-500/20 text-red-300 border-red-500/40',
};

const getAccountAgeLabel = (createdAt: string) => {
  const createdTime = new Date(createdAt).getTime();
  const days = Math.max(
    0,
    Math.floor((Date.now() - createdTime) / (1000 * 60 * 60 * 24))
  );
  const years = Math.floor(days / 365);
  const remainingDays = days % 365;
  if (years > 0) {
    return `${years}y ${remainingDays}d`;
  }
  return `${remainingDays}d`;
};

const formatTimestamp = (value: string) =>
  new Date(value).toLocaleString();

const getEscalationStatus = (warningsCount: number) => {
  if (warningsCount >= 5) {
    return {
      label: 'Permanent Ban Recommended',
      style: 'bg-red-500/15 border-red-500/40 text-red-200',
    };
  }
  if (warningsCount >= 3) {
    return {
      label: 'Temporary Ban Recommended',
      style: 'bg-yellow-500/15 border-yellow-500/40 text-yellow-200',
    };
  }
  return {
    label: 'Normal',
    style: 'bg-green-500/15 border-green-500/40 text-green-200',
  };
};

const getRiskStatus = (warnings: WarningEntry[]) => {
  const severityScore = warnings.reduce((total, warning) => {
    if (warning.severity === 'High') return total + 3;
    if (warning.severity === 'Medium') return total + 2;
    return total + 1;
  }, 0);

  if (warnings.length === 0 || severityScore <= 2) {
    return { label: 'Low Risk', color: 'bg-green-500', width: 'w-1/3' };
  }
  if (severityScore <= 6) {
    return { label: 'Moderate Risk', color: 'bg-yellow-500', width: 'w-2/3' };
  }
  return { label: 'High Risk', color: 'bg-red-500', width: 'w-full' };
};

const getTimelineItems = (warnings: WarningEntry[], notes: NoteEntry[]) => {
  const warningItems: TimelineItem[] = warnings.map((warning) => ({
    ...warning,
    type: 'warning',
  }));

  const noteItems: TimelineItem[] = notes.map((note) => ({
    ...note,
    type: 'note',
  }));

  return [...warningItems, ...noteItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const Splash = () => {
  const [warnings, setWarnings] = useState<WarningEntry[]>([]);
  const [reasonInput, setReasonInput] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('Medium');
  const [notes, setNotes] = useState<NoteEntry[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);

  const warningsCount = warnings.length;
  const lastWarning = warnings[0];
  const escalationStatus = getEscalationStatus(warningsCount);
  const riskStatus = getRiskStatus(warnings);
  const timelineItems = getTimelineItems(warnings, notes);
  const displayUsername = profile ? `u/${profile.username}` : 'Search a username';
  const accountAge = profile ? getAccountAgeLabel(profile.createdAt) : 'N/A';
  const totalKarma = profile ? profile.totalKarma : 0;

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [savedWarnings, savedNotes] = await Promise.all([
          loadWarningsFromApi(),
          loadNotesFromApi(),
        ]);

        if (!isMounted) {
          return;
        }

        setWarnings(savedWarnings);
        setNotes(savedNotes);
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : 'Failed to load data';
          setLoadError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleWarnUser = () => {
    const trimmedReason = reasonInput.trim();
    const reason = trimmedReason.length > 0 ? trimmedReason : 'Manual warning';

    const newWarning: WarningEntry = {
      reason,
      timestamp: new Date().toLocaleString(),
      moderator: moderatorName,
      severity: selectedSeverity,
    };

    setWarnings((prev) => {
      const updatedWarnings = [newWarning, ...prev];
      void saveWarningsToApi(updatedWarnings);
      return updatedWarnings;
    });
    setReasonInput('');
  };

  const handleAddNote = () => {
    const trimmedNote = noteInput.trim();
    if (trimmedNote.length === 0) {
      return;
    }

    const newNote: NoteEntry = {
      note: trimmedNote,
      timestamp: new Date().toLocaleString(),
      moderator: moderatorName,
    };

    setNotes((prev) => {
      const updatedNotes = [newNote, ...prev];
      void saveNotesToApi(updatedNotes);
      return updatedNotes;
    });
    setNoteInput('');
  };

  const handlePresetClick = (preset: string) => {
    setReasonInput(preset);
  };

  const handleClearCaseData = async () => {
    setIsClearing(true);
    setClearError(null);
    setClearSuccess(null);
    console.log('[RuleWatch] Clear case data started');

    try {
      await Promise.all([clearWarningsFromApi(), clearNotesFromApi()]);
      setWarnings([]);
      setNotes([]);
      setClearSuccess('Case data cleared successfully');
      console.log('[RuleWatch] Clear case data completed');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to clear case data';
      setClearError(message);
      console.error('[RuleWatch] Clear case data failed', error);
    } finally {
      setIsClearing(false);
    }
  };

  const handleProfileSearch = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = usernameInput.trim();
    if (!trimmed) {
      setProfileError('Enter a username to search.');
      return;
    }

    setProfileLoading(true);
    setProfileError(null);

    try {
      const loadedProfile = await loadUserProfileFromApi(trimmed);
      setProfile(loadedProfile);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load user profile';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-5xl font-bold">RuleWatch</h1>
          <p className="text-lg text-zinc-300">
            Moderation case management dashboard
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Moderation Profile</h2>
            <p className="text-sm text-zinc-400">
              Search a Reddit user to load account history and risk analysis.
            </p>
          </div>

          <form
            className="flex flex-col sm:flex-row gap-3"
            onSubmit={handleProfileSearch}
          >
            <input
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter username (without u/)"
              value={usernameInput}
              onChange={(event) => setUsernameInput(event.target.value)}
            />
            <button
              className="bg-blue-500 px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
              type="submit"
              disabled={profileLoading}
            >
              {profileLoading ? 'Loading...' : 'Search'}
            </button>
          </form>

          {profileError ? (
            <p className="text-sm text-red-300">{profileError}</p>
          ) : null}

          {profile ? (
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
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${
                        riskBadgeStyles[profile.risk.spamRisk]
                      }`}
                    >
                      Spam Risk: {profile.risk.spamRisk}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${
                        riskBadgeStyles[profile.risk.harassmentRisk]
                      }`}
                    >
                      Harassment Risk: {profile.risk.harassmentRisk}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs border ${
                        profile.risk.banRecommendation === 'Permanent'
                          ? 'bg-red-500/20 text-red-200 border-red-500/40'
                          : profile.risk.banRecommendation === 'Temporary'
                          ? 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40'
                          : 'bg-zinc-700/30 text-zinc-200 border-zinc-600'
                      }`}
                    >
                      Ban: {profile.risk.banRecommendation}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-300 mb-2">
                      Suspicious patterns
                    </p>
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

                <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 space-y-3">
                  <h3 className="text-lg font-semibold">Recent Posts</h3>
                  {profile.recentPosts.length === 0 ? (
                    <p className="text-sm text-zinc-400">No recent posts found.</p>
                  ) : (
                    <ul className="space-y-2">
                      {profile.recentPosts.map((post) => (
                        <li key={post.id} className="border border-zinc-700 rounded-lg p-3">
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
              </div>

              <div className="bg-zinc-800 rounded-xl p-4 border border-zinc-700 space-y-3">
                <h3 className="text-lg font-semibold">Recent Comments</h3>
                {profile.recentComments.length === 0 ? (
                  <p className="text-sm text-zinc-400">No recent comments found.</p>
                ) : (
                  <ul className="space-y-2">
                    {profile.recentComments.map((comment) => (
                      <li key={comment.id} className="border border-zinc-700 rounded-lg p-3">
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

        <div className="space-y-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div
              className={`border rounded-2xl px-4 py-3 ${escalationStatus.style}`}
            >
              <span className="text-sm uppercase tracking-wide text-zinc-300">
                Escalation Status
              </span>
              <div className="text-lg font-semibold">
                {escalationStatus.label}
              </div>
            </div>
            <button
              className="bg-red-600/80 border border-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition"
              onClick={handleClearCaseData}
              disabled={isClearing}
            >
              {isClearing ? 'Clearing...' : 'Clear All Case Data'}
            </button>
          </div>
          {clearSuccess ? (
            <p className="text-sm text-green-300">{clearSuccess}</p>
          ) : null}
          {clearError ? (
            <p className="text-sm text-red-300">{clearError}</p>
          ) : null}
          {isLoading ? (
            <p className="text-sm text-zinc-400">Loading saved data...</p>
          ) : null}
          {!isLoading && loadError ? (
            <p className="text-sm text-red-300">{loadError}</p>
          ) : null}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">User Overview</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Username</p>
                  <p className="text-lg font-semibold">{displayUsername}</p>
                  <p className="text-xs text-zinc-400">Account Age: {accountAge}</p>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Warnings</p>
                  <p className="text-lg font-semibold">{warningsCount}</p>
                  <p className="text-xs text-zinc-400">Total Karma: {totalKarma}</p>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 sm:col-span-2">
                  <p className="text-sm text-zinc-400">Last Warning</p>
                  <p className="text-lg font-semibold">
                    {lastWarning ? lastWarning.reason : 'No warnings yet'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6">
              <h3 className="text-lg font-semibold mb-3">User Risk Score</h3>
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-zinc-400">Risk Level</span>
                  <span className="text-sm font-semibold">{riskStatus.label}</span>
                </div>
                <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                  <div className={`h-full ${riskStatus.color} ${riskStatus.width}`} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Issue Warning</h2>
              <p className="text-sm text-zinc-400">
                Moderator: {moderatorName}
              </p>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4">
              <label className="block text-sm text-zinc-300 mb-2" htmlFor="reason">
                Warning reason
              </label>
              <input
                id="reason"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="e.g. Rule 2: Personal attacks"
                value={reasonInput}
                onChange={(event) => setReasonInput(event.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {presetReasons.map((preset) => (
                  <button
                    key={preset}
                    className="px-3 py-1 rounded-full text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-red-400 hover:text-white transition"
                    onClick={() => handlePresetClick(preset)}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm text-zinc-300 mb-2">Severity</p>
              <div className="flex flex-wrap gap-2">
                {severityOptions.map((severity) => (
                  <button
                    key={severity}
                    className={`px-3 py-1 rounded-full border text-xs font-semibold transition ${
                      severityStyles[severity]
                    } ${
                      selectedSeverity === severity
                        ? 'ring-2 ring-white/20'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    onClick={() => setSelectedSeverity(severity)}
                  >
                    {severity}
                  </button>
                ))}
              </div>
            </div>

            <button
              className="bg-red-500 px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition"
              onClick={handleWarnUser}
            >
              Warn User
            </button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Warning History</h3>
            {warnings.length === 0 ? (
              <p className="text-zinc-400">No warnings issued yet.</p>
            ) : (
              <ul className="space-y-3">
                {warnings.map((warning, index) => (
                  <li
                    key={`${warning.timestamp}-${index}`}
                    className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-400">
                        {warning.timestamp}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs border ${
                          severityStyles[warning.severity]
                        }`}
                      >
                        {warning.severity}
                      </span>
                    </div>
                    <span className="text-base font-medium">
                      {warning.reason}
                    </span>
                    <span className="text-xs text-zinc-400">
                      Issued by {warning.moderator}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4">Moderator Notes</h3>
            <div className="bg-zinc-800 rounded-xl p-4 mb-4">
              <label className="block text-sm text-zinc-300 mb-2" htmlFor="note">
                Add a note
              </label>
              <textarea
                id="note"
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[96px]"
                placeholder="Add context for the mod team..."
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
              />
              <button
                className="mt-3 bg-blue-500 px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition"
                onClick={handleAddNote}
              >
                Add Note
              </button>
            </div>

            {notes.length === 0 ? (
              <p className="text-zinc-400">No moderator notes yet.</p>
            ) : (
              <ul className="space-y-3">
                {notes.map((note, index) => (
                  <li
                    key={`${note.timestamp}-${index}`}
                    className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-1"
                  >
                    <span className="text-sm text-zinc-400">
                      {note.timestamp}
                    </span>
                    <span className="text-base font-medium">{note.note}</span>
                    <span className="text-xs text-zinc-400">
                      Added by {note.moderator}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h3 className="text-xl font-semibold mb-4">Moderation Timeline</h3>
          {timelineItems.length === 0 ? (
            <p className="text-zinc-400">No activity yet.</p>
          ) : (
            <ul className="space-y-3">
              {timelineItems.map((item, index) => (
                <li
                  key={`${item.timestamp}-${index}`}
                  className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">
                      {item.timestamp}
                    </span>
                    <span className="text-xs uppercase tracking-wide text-zinc-300">
                      {item.type === 'warning' ? 'Warning' : 'Note'}
                    </span>
                  </div>
                  {item.type === 'warning' ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium">
                          {item.reason}
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs border ${
                            severityStyles[item.severity]
                          }`}
                        >
                          {item.severity}
                        </span>
                      </div>
                      <span className="text-xs text-zinc-400">
                        Issued by {item.moderator}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-base font-medium">{item.note}</span>
                      <span className="text-xs text-zinc-400">
                        Added by {item.moderator}
                      </span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <Splash />
    </StrictMode>
  );
}
