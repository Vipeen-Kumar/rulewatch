import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

type Severity = 'Low' | 'Medium' | 'High';

type WarningEntry = {
  reason: string;
  timestamp: string;
  moderator: string;
  severity: Severity;
};

type NoteEntry = {
  note: string;
  timestamp: string;
  moderator: string;
};

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

const initialWarnings: WarningEntry[] = [
  {
    reason: 'Spam Links',
    timestamp: 'May 19, 2026 10:42 AM',
    moderator: moderatorName,
    severity: 'Medium',
  },
  {
    reason: 'Harassment',
    timestamp: 'May 20, 2026 08:15 AM',
    moderator: moderatorName,
    severity: 'High',
  },
];

const initialNotes: NoteEntry[] = [
  {
    note: 'Reached out via modmail for clarification.',
    timestamp: 'May 20, 2026 09:05 AM',
    moderator: moderatorName,
  },
];

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
  const [warnings, setWarnings] = useState<WarningEntry[]>(initialWarnings);
  const [reasonInput, setReasonInput] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('Medium');
  const [notes, setNotes] = useState<NoteEntry[]>(initialNotes);
  const [noteInput, setNoteInput] = useState('');

  const warningsCount = warnings.length;
  const lastWarning = warnings[0];
  const escalationStatus = getEscalationStatus(warningsCount);
  const riskStatus = getRiskStatus(warnings);
  const timelineItems = getTimelineItems(warnings, notes);

  const handleWarnUser = () => {
    const trimmedReason = reasonInput.trim();
    const reason = trimmedReason.length > 0 ? trimmedReason : 'Manual warning';

    const newWarning: WarningEntry = {
      reason,
      timestamp: new Date().toLocaleString(),
      moderator: moderatorName,
      severity: selectedSeverity,
    };

    setWarnings((prev) => [newWarning, ...prev]);
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

    setNotes((prev) => [newNote, ...prev]);
    setNoteInput('');
  };

  const handlePresetClick = (preset: string) => {
    setReasonInput(preset);
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

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">User Overview</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Username</p>
                  <p className="text-lg font-semibold">bad_user123</p>
                </div>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4">
                  <p className="text-sm text-zinc-400">Warnings</p>
                  <p className="text-lg font-semibold">{warningsCount}</p>
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
