import './index.css';

import { StrictMode, useEffect, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import type {
  AppendTimelineRequest,
  CaseStatus,
  LoadNotesResponse,
  LoadCaseStatusResponse,
  LoadScanResultResponse,
  LoadTimelineResponse,
  LoadWarningsResponse,
  NoteEntry,
  PostScanResult,
  SaveCaseStatusRequest,
  SaveNotesRequest,
  SaveWarningsRequest,
  Severity,
  TargetPostResponse,
  TimelineEvent,
  UserProfile,
  UserProfileResponse,
  WarningEntry,
} from '../shared/api';
import { ModAssistant, createModSummary } from './components/ModAssistant';
import { ProfileSearch } from './components/ProfileSearch';
import { Timeline } from './components/Timeline';
import { UserOverview } from './components/UserOverview';
import { WarningHistory } from './components/WarningHistory';
import { CollapsibleSection } from './components/CollapsibleSection';
import { DashboardSection } from './components/DashboardSection';
import { MobileTabs } from './components/MobileTabs';
import { RecentActivity } from './components/RecentActivity';

const moderatorName = 'u/VipeenKumar';

const severityOptions: Severity[] = ['Low', 'Medium', 'High'];

const caseStatusOptions: CaseStatus[] = [
  'Open',
  'Under Review',
  'Escalated',
  'Resolved',
  'Banned',
];

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

type DashboardSectionId =
  | 'overview'
  | 'ai'
  | 'activity'
  | 'warnings'
  | 'timeline'
  | 'notes';

const dashboardSections: Array<{ id: DashboardSectionId; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'ai', label: 'AI Report' },
  { id: 'activity', label: 'Activity' },
  { id: 'warnings', label: 'Warnings' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'notes', label: 'Notes' },
];

const buildApiUrl = (path: string, targetPostId?: string | null) => {
  if (!targetPostId) {
    return path;
  }
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}targetPostId=${encodeURIComponent(targetPostId)}`;
};


const loadWarningsFromApi = async (targetPostId?: string | null) => {
  console.log('[RuleWatch] Loading warnings from API');
  const response = await fetch(buildApiUrl('/api/warnings', targetPostId));
  if (!response.ok) {
    throw new Error('Failed to load warnings');
  }
  const data = (await response.json()) as LoadWarningsResponse;
  console.log('[RuleWatch] Loaded warnings count', data.warnings?.length ?? 0);
  return data.warnings ?? [];
};

const saveWarningsToApi = async (
  warnings: WarningEntry[],
  targetPostId?: string | null
) => {
  const payload: SaveWarningsRequest = { warnings };
  await fetch(buildApiUrl('/api/warnings', targetPostId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

const loadNotesFromApi = async (targetPostId?: string | null) => {
  console.log('[RuleWatch] Loading notes from API');
  const response = await fetch(buildApiUrl('/api/notes', targetPostId));
  if (!response.ok) {
    throw new Error('Failed to load notes');
  }
  const data = (await response.json()) as LoadNotesResponse;
  console.log('[RuleWatch] Loaded notes count', data.notes?.length ?? 0);
  return data.notes ?? [];
};

const saveNotesToApi = async (notes: NoteEntry[], targetPostId?: string | null) => {
  const payload: SaveNotesRequest = { notes };
  await fetch(buildApiUrl('/api/notes', targetPostId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
};

const loadCaseStatusFromApi = async (targetPostId?: string | null) => {
  const response = await fetch(buildApiUrl('/api/case-status', targetPostId));
  if (!response.ok) {
    throw new Error('Failed to load case status');
  }
  const data = (await response.json()) as LoadCaseStatusResponse;
  return data.status;
};

const saveCaseStatusToApi = async (
  status: CaseStatus,
  targetPostId?: string | null
) => {
  const payload: SaveCaseStatusRequest = { status };
  const response = await fetch(buildApiUrl('/api/case-status', targetPostId), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to save case status');
  }
};

const loadTimelineFromApi = async (targetPostId?: string | null) => {
  const response = await fetch(buildApiUrl('/api/timeline', targetPostId));
  if (!response.ok) {
    throw new Error('Failed to load timeline');
  }
  const data = (await response.json()) as LoadTimelineResponse;
  return data.events ?? [];
};

const loadScanResultFromApi = async (targetPostId?: string | null) => {
  console.log('[RuleWatch] Loading scan result from API');
  const response = await fetch(buildApiUrl('/api/scan-result', targetPostId));
  if (response.status === 404) {
    console.log('[RuleWatch] Scan result not found (404)');
    return null;
  }
  if (!response.ok) {
    console.error('[RuleWatch] Failed to load scan result', response.status);
    throw new Error('Failed to load scan result');
  }
  const data = (await response.json()) as LoadScanResultResponse;
  console.log('[RuleWatch] Scan result loaded', data.result?.postId ?? 'unknown');
  return data.result ?? null;
};

const runScanNow = async (targetPostId?: string | null) => {
  const response = await fetch(buildApiUrl('/api/scan-now', targetPostId), {
    method: 'POST',
  });
  if (!response.ok) {
    throw new Error('Failed to run scan');
  }
  const data = (await response.json()) as LoadScanResultResponse;
  return data.result ?? null;
};

const appendTimelineEventToApi = async (
  event: TimelineEvent,
  targetPostId?: string | null
) => {
  const payload: AppendTimelineRequest = { event };
  const response = await fetch(buildApiUrl('/api/timeline', targetPostId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error('Failed to append timeline event');
  }
};

const clearWarningsFromApi = async (targetPostId?: string | null) => {
  console.log('[RuleWatch] Clearing warnings via API');
  const response = await fetch(buildApiUrl('/api/warnings', targetPostId), {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to clear warnings');
  }
};

const clearNotesFromApi = async (targetPostId?: string | null) => {
  console.log('[RuleWatch] Clearing notes via API');
  const response = await fetch(buildApiUrl('/api/notes', targetPostId), {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to clear notes');
  }
};

const normalizeUsername = (value: string) =>
  value.replace(/^u\//i, '').trim();

const loadUserProfileFromApi = async (username: string) => {
  const normalized = normalizeUsername(username);
  console.log('[RuleWatch] loadUserProfileFromApi', {
    raw: username,
    normalized,
  });
  const response = await fetch(
    `/api/user-profile?username=${encodeURIComponent(normalized)}`
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

const loadTargetPostFromApi = async () => {
  const response = await fetch('/api/target-post');
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message =
      typeof errorBody?.message === 'string'
        ? errorBody.message
        : 'Failed to load target post';
    throw new Error(message);
  }
  const data = (await response.json()) as TargetPostResponse;
  return data;
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

const createTimelineEvent = (
  type: TimelineEvent['type'],
  message: string,
  actor: string
): TimelineEvent => {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    type,
    timestamp: new Date().toLocaleString(),
    message,
    actor,
  };
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
  const [autoProfileLoading, setAutoProfileLoading] = useState(true);
  const [autoProfileError, setAutoProfileError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const [clearSuccess, setClearSuccess] = useState<string | null>(null);
  const [caseStatus, setCaseStatus] = useState<CaseStatus>('Open');
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);
  const [modSummary, setModSummary] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<PostScanResult | null>(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [targetPostId, setTargetPostId] = useState<string | null>(null);
  const [targetPostTitle, setTargetPostTitle] = useState('');
  const [targetPostAuthor, setTargetPostAuthor] = useState('');
  const [targetPostBody, setTargetPostBody] = useState('');
  const [targetPostLoading, setTargetPostLoading] = useState(true);
  const [targetPostError, setTargetPostError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('overview');

  const warningsCount = warnings.length;
  const lastWarning = warnings[0];
  const escalationStatus = getEscalationStatus(warningsCount);
  const riskStatus = getRiskStatus(warnings);
  const displayUsername = profile ? `u/${profile.username}` : 'Search a username';
  const accountAge = profile ? getAccountAgeLabel(profile.createdAt) : 'N/A';
  const totalKarma = profile ? profile.totalKarma : 0;

  useEffect(() => {
    let isMounted = true;

    const loadCaseData = async (activePostId?: string | null) => {
      try {
        const [savedWarnings, savedNotes, savedStatus, savedTimeline] =
          await Promise.all([
            loadWarningsFromApi(activePostId),
            loadNotesFromApi(activePostId),
            loadCaseStatusFromApi(activePostId),
            loadTimelineFromApi(activePostId),
          ]);

        if (!isMounted) {
          return;
        }

        setWarnings(savedWarnings);
        setNotes(savedNotes);
        setCaseStatus(savedStatus);
        setTimelineEvents(savedTimeline);

        return savedTimeline;
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : 'Failed to load data';
          setLoadError(message);
          setStatusError(message);
          setTimelineError(message);
        }

        return [] as TimelineEvent[];
      }
    };

    const loadDashboard = async () => {
      setTargetPostLoading(true);
      setAutoProfileLoading(true);
      setAutoProfileError(null);
      setTargetPostError(null);
      setScanError(null);
      setScanLoading(true);

      try {
        const target = await loadTargetPostFromApi();
        if (!isMounted) {
          return;
        }
        const author = normalizeUsername(target.author ?? '');
        setTargetPostId(target.postId);
        setTargetPostTitle(target.title);
        setTargetPostAuthor(author);
        setTargetPostBody(target.body);
        if (author) {
          setUsernameInput(author);
        }

        const savedTimeline = await loadCaseData(target.postId);

        if (author) {
          const loadedProfile = await loadUserProfileFromApi(author);
          if (isMounted) {
            setProfile(loadedProfile);
          }
          const presenceEventExists = savedTimeline.some(
            (event) => event.type === 'subreddit_presence_completed'
          );
          if (!presenceEventExists) {
            const presenceEvent = createTimelineEvent(
              'subreddit_presence_completed',
              'Subreddit presence analysis completed.',
              'RuleWatch AI'
            );
            setTimelineEvents((prev) => [presenceEvent, ...prev]);
            await appendTimelineEventToApi(presenceEvent, target.postId);
          }
        } else if (isMounted) {
          setAutoProfileError('Current author not found');
        }

        let scan = await loadScanResultFromApi(target.postId);
        if (!scan) {
          scan = await runScanNow(target.postId);
        }
        if (isMounted) {
          setScanResult(scan);
        }
      } catch (error) {
        if (isMounted) {
          const message =
            error instanceof Error ? error.message : 'Failed to auto-load post data';
          setTargetPostError(message);
          setAutoProfileError('Auto-load failed. Use manual search to continue.');
        }

        await loadCaseData(null);

        try {
          const scan = await loadScanResultFromApi(null);
          if (isMounted) {
            setScanResult(scan);
          }
        } catch (scanError) {
          if (isMounted) {
            const message =
              scanError instanceof Error ? scanError.message : 'Failed to load scan result';
            setScanError(message);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsStatusLoading(false);
          setTargetPostLoading(false);
          setAutoProfileLoading(false);
          setScanLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!profile || modSummary || autoProfileLoading) {
      return;
    }
    const summary = createModSummary(warnings, notes, profile);
    setModSummary(summary);
  }, [autoProfileLoading, modSummary, notes, profile, warnings]);

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
      void saveWarningsToApi(updatedWarnings, targetPostId);
      return updatedWarnings;
    });
    addTimelineEvent(
      'warning_added',
      `Warning issued: ${reason} (${selectedSeverity})`,
      moderatorName
    );
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
      void saveNotesToApi(updatedNotes, targetPostId);
      return updatedNotes;
    });
    addTimelineEvent('note_added', 'Moderator note added.', moderatorName);
    setNoteInput('');
  };

  const handlePresetClick = (preset: string) => {
    setReasonInput(preset);
  };

  const addTimelineEvent = (
    type: TimelineEvent['type'],
    message: string,
    actor: string
  ) => {
    const event = createTimelineEvent(type, message, actor);
    setTimelineEvents((prev) => {
      const updated = [event, ...prev];
      void appendTimelineEventToApi(event, targetPostId);
      return updated;
    });
  };

  const logPresenceEventIfNeeded = () => {
    const hasPresenceEvent = timelineEvents.some(
      (event) => event.type === 'subreddit_presence_completed'
    );
    if (!hasPresenceEvent) {
      addTimelineEvent(
        'subreddit_presence_completed',
        'Subreddit presence analysis completed.',
        'RuleWatch AI'
      );
    }
  };

  const handleClearCaseData = async () => {
    setIsClearing(true);
    setClearError(null);
    setClearSuccess(null);
    console.log('[RuleWatch] Clear case data started');

    try {
      await Promise.all([
        clearWarningsFromApi(targetPostId),
        clearNotesFromApi(targetPostId),
      ]);
      setWarnings([]);
      setNotes([]);
      setClearSuccess('Case data cleared successfully');
      addTimelineEvent('case_cleared', 'Case data cleared.', moderatorName);
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
    const trimmed = normalizeUsername(usernameInput);
    if (!trimmed) {
      setProfileError('Enter a username to search.');
      return;
    }

    setProfileLoading(true);
    setProfileError(null);
    setAutoProfileError(null);

    try {
      const loadedProfile = await loadUserProfileFromApi(trimmed);
      setProfile(loadedProfile);
      logPresenceEventIfNeeded();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load user profile';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUsernameSelect = async (username: string) => {
    const normalized = normalizeUsername(username);
    console.log('[RuleWatch] username selected', {
      raw: username,
      normalized,
    });
    setUsernameInput(normalized);
    setProfileLoading(true);
    setProfileError(null);
    setAutoProfileError(null);

    try {
      const loadedProfile = await loadUserProfileFromApi(normalized);
      setProfile(loadedProfile);
      logPresenceEventIfNeeded();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to load user profile';
      setProfileError(message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCaseStatusChange = async (status: CaseStatus) => {
    setIsStatusLoading(true);
    setStatusError(null);
    try {
      await saveCaseStatusToApi(status, targetPostId);
      setCaseStatus(status);
      addTimelineEvent('status_changed', `Status changed to ${status}.`, moderatorName);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update case status';
      setStatusError(message);
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleGenerateSummary = (summary: string) => {
    setModSummary(summary);
    addTimelineEvent('summary_generated', 'Moderation summary generated.', moderatorName);
  };

  const renderOverviewContent = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold sm:text-xl">Target Post</h2>
          <span className="text-[10px] text-zinc-400 sm:text-xs">
            {targetPostId ? `Post ID ${targetPostId}` : 'Unknown'}
          </span>
        </div>
        {targetPostLoading ? (
          <p className="text-xs text-zinc-400 sm:text-sm">Loading target post...</p>
        ) : targetPostError ? (
          <p className="text-xs text-yellow-300 sm:text-sm">{targetPostError}</p>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-zinc-400">
              u/{targetPostAuthor || 'unknown'}
            </p>
            <p className="text-sm font-semibold sm:text-lg">
              {targetPostTitle || 'Untitled'}
            </p>
            <div className="grid gap-1 text-[10px] text-zinc-300 sm:text-xs">
              <div className="flex items-center justify-between">
                <span>Risk</span>
                <span>{riskStatus.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Score</span>
                <span>{scanResult?.riskScore ?? 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Action</span>
                <span>{scanResult?.recommendedAction ?? 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <ProfileSearch
        usernameInput={usernameInput}
        onUsernameChange={setUsernameInput}
        onSearch={handleProfileSearch}
        onSelectUsername={handleUsernameSelect}
        isLoading={profileLoading}
        autoLoading={autoProfileLoading}
        autoError={autoProfileError}
        error={profileError}
        profile={profile}
        formatTimestamp={formatTimestamp}
        getAccountAgeLabel={getAccountAgeLabel}
        showActivity={false}
      />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="sm:hidden bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Case Status</span>
            <select
              className="bg-transparent text-white text-xs font-semibold focus:outline-none"
              value={caseStatus}
              onChange={(event) => onStatusChange(event.target.value as CaseStatus)}
              disabled={isStatusLoading}
            >
              {caseStatusOptions.map((status) => (
                <option key={status} value={status} className="text-black">
                  {status}
                </option>
              ))}
            </select>
          </div>
          {statusError ? (
            <p className="text-[10px] text-red-300">{statusError}</p>
          ) : null}
          <div className="grid gap-1 text-[10px] text-zinc-300">
            <div className="flex items-center justify-between">
              <span>Username</span>
              <span>{displayUsername}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Karma</span>
              <span>{totalKarma}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Age</span>
              <span>{accountAge}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Spam Risk</span>
              <span>{profile?.risk.spamRisk ?? 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Presence</span>
              <span>{profile?.subredditPresence.length ?? 0} subs</span>
            </div>
          </div>
        </div>

        <div className="hidden sm:block">
          <UserOverview
            displayUsername={displayUsername}
            accountAge={accountAge}
            warningsCount={warningsCount}
            totalKarma={totalKarma}
            lastWarning={lastWarning}
            riskStatus={riskStatus}
            caseStatus={caseStatus}
            isStatusLoading={isStatusLoading}
            statusError={statusError}
            onStatusChange={handleCaseStatusChange}
          />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className={`border rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${escalationStatus.style}`}>
            <span className="text-xs uppercase tracking-wide text-zinc-300 sm:text-sm">
              Escalation Status
            </span>
            <div className="text-sm font-semibold sm:text-lg">
              {escalationStatus.label}
            </div>
          </div>
          <button
            className="bg-red-600/80 border border-red-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition sm:rounded-xl sm:py-3"
            onClick={handleClearCaseData}
            disabled={isClearing}
          >
            {isClearing ? 'Clearing...' : 'Clear All Case Data'}
          </button>
          {clearSuccess ? (
            <p className="text-xs text-green-300 sm:text-sm">{clearSuccess}</p>
          ) : null}
          {clearError ? (
            <p className="text-xs text-red-300 sm:text-sm">{clearError}</p>
          ) : null}
          {isLoading ? (
            <p className="text-xs text-zinc-400 sm:text-sm">Loading saved data...</p>
          ) : null}
          {!isLoading && loadError ? (
            <p className="text-xs text-red-300 sm:text-sm">{loadError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );

  const renderAiContent = () => (
    <div className="space-y-6">
      <ModAssistant
        warnings={warnings}
        notes={notes}
        profile={profile}
        summary={modSummary}
        scanResult={scanResult}
        scanLoading={scanLoading}
        scanError={scanError}
        onGenerateSummary={handleGenerateSummary}
      />

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Scan Debug</h2>
          <span className="text-xs text-zinc-400">Temporary</span>
        </div>
        <div className="text-sm text-zinc-300">
          <p>Scan exists: {scanResult ? 'Yes' : 'No'}</p>
          <p>
            Last scan timestamp:{' '}
            {scanResult?.createdAt ? formatTimestamp(scanResult.createdAt) : 'N/A'}
          </p>
        </div>
        <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-4 text-xs text-zinc-200 whitespace-pre-wrap break-words">
          {scanResult ? JSON.stringify(scanResult, null, 2) : 'No scan payload.'}
        </div>
        {scanLoading ? <p className="text-xs text-zinc-400">Loading scan result...</p> : null}
        {scanError ? <p className="text-xs text-red-300">{scanError}</p> : null}
      </div>
    </div>
  );

  const renderActivityContent = () => (
    <RecentActivity profile={profile} formatTimestamp={formatTimestamp} />
  );

  const renderWarningsContent = () => (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <WarningHistory warnings={warnings} severityStyles={severityStyles} />

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-1 sm:text-2xl sm:mb-2">
            Issue Warning
          </h2>
          <p className="text-xs text-zinc-400 sm:text-sm">
            Moderator: {moderatorName}
          </p>
        </div>

        <div className="bg-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <label className="block text-xs text-zinc-300 mb-2 sm:text-sm" htmlFor="reason">
            Warning reason
          </label>
          <input
            id="reason"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder="e.g. Rule 2: Personal attacks"
            value={reasonInput}
            onChange={(event) => setReasonInput(event.target.value)}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {presetReasons.map((preset) => (
              <button
                key={preset}
                className="px-3 py-1 rounded-full text-[10px] bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-red-400 hover:text-white transition sm:text-xs"
                onClick={() => handlePresetClick(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-zinc-300 mb-2 sm:text-sm">Severity</p>
          <div className="flex flex-wrap gap-2">
            {severityOptions.map((severity) => (
              <button
                key={severity}
                className={`px-3 py-1.5 rounded-full border text-[10px] font-semibold transition sm:px-4 sm:py-2 sm:text-xs ${
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
          className="bg-red-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-red-600 transition sm:rounded-xl sm:py-3"
          onClick={handleWarnUser}
        >
          Warn User
        </button>
      </div>
    </div>
  );

  const renderTimelineContent = () => (
    <div className="space-y-2">
      {timelineError ? <p className="text-sm text-red-300">{timelineError}</p> : null}
      <Timeline
        warnings={warnings}
        notes={notes}
        events={timelineEvents}
        severityStyles={severityStyles}
      />
    </div>
  );

  const renderNotesContent = () => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6">
      <h3 className="text-lg font-semibold mb-3 sm:text-xl sm:mb-4">
        Moderator Notes
      </h3>
      <div className="bg-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4">
        <label className="block text-xs text-zinc-300 mb-2 sm:text-sm" htmlFor="note">
          Add a note
        </label>
        <textarea
          id="note"
          className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-20 sm:min-h-24"
          placeholder="Add context for the mod team..."
          value={noteInput}
          onChange={(event) => setNoteInput(event.target.value)}
        />
        <button
          className="mt-3 bg-blue-500 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition sm:rounded-xl sm:py-3"
          onClick={handleAddNote}
        >
          Add Note
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="text-xs text-zinc-400 sm:text-sm">No moderator notes yet.</p>
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {notes.map((note, index) => (
            <li
              key={`${note.timestamp}-${index}`}
              className="bg-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col gap-1"
            >
              <span className="text-[10px] text-zinc-400 sm:text-sm">{note.timestamp}</span>
              <span className="text-sm font-medium sm:text-base">{note.note}</span>
              <span className="text-[10px] text-zinc-400 sm:text-xs">
                Added by {note.moderator}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  const renderSectionBody = (sectionId: DashboardSectionId) => {
    switch (sectionId) {
      case 'overview':
        return renderOverviewContent();
      case 'ai':
        return renderAiContent();
      case 'activity':
        return renderActivityContent();
      case 'warnings':
        return renderWarningsContent();
      case 'timeline':
        return renderTimelineContent();
      case 'notes':
        return renderNotesContent();
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 pb-16 sm:pb-24">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        <div className="flex flex-col items-start gap-1.5 sm:gap-2">
          <h1 className="text-3xl sm:text-5xl font-bold">RuleWatch</h1>
          <p className="text-sm sm:text-lg text-zinc-300">
            Moderation case management dashboard
          </p>
        </div>

        <MobileTabs
          tabs={dashboardSections}
          activeTab={activeSection}
          onChange={(id) => setActiveSection(id as DashboardSectionId)}
        />

        <div className="space-y-3 sm:space-y-4 lg:hidden">
          {dashboardSections.map((section) => (
            <CollapsibleSection
              key={section.id}
              title={section.label}
              isOpen={activeSection === section.id}
              onToggle={() => setActiveSection(section.id)}
              renderContent={() => renderSectionBody(section.id)}
            />
          ))}
        </div>

        <div className="hidden lg:block space-y-6">
          {dashboardSections.map((section) =>
            section.id === activeSection ? (
              <DashboardSection key={section.id} title={section.label}>
                {renderSectionBody(section.id)}
              </DashboardSection>
            ) : null
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
