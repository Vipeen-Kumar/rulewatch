import './index.css';

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

type WarningEntry = {
  reason: string;
  timestamp: string;
};

const initialWarnings: WarningEntry[] = [
  { reason: 'Spam Links', timestamp: 'May 19, 2026 10:42 AM' },
  { reason: 'Harassment', timestamp: 'May 20, 2026 08:15 AM' },
];

export const Splash = () => {
  const [warnings, setWarnings] = useState<WarningEntry[]>(initialWarnings);
  const [reasonInput, setReasonInput] = useState('');

  const warningsCount = warnings.length;
  const lastWarning = warnings[0];

  const handleWarnUser = () => {
    const trimmedReason = reasonInput.trim();
    const reason = trimmedReason.length > 0 ? trimmedReason : 'Manual warning';

    const newWarning: WarningEntry = {
      reason,
      timestamp: new Date().toLocaleString(),
    };

    setWarnings((prev) => [newWarning, ...prev]);
    setReasonInput('');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-6">
      <h1 className="text-5xl font-bold mb-4">RuleWatch</h1>

      <p className="text-xl mb-8 text-center">
        Smart moderation workflow assistant
      </p>

      <div className="bg-zinc-900 p-6 rounded-2xl w-full max-w-xl">
        <h2 className="text-2xl font-semibold mb-4">User Moderation Info</h2>

        <div className="space-y-2 mb-6">
          <p>Username: bad_user123</p>
          <p>Warnings: {warningsCount}</p>
          <p>
            Last Reason:{' '}
            {lastWarning ? lastWarning.reason : 'No warnings yet'}
          </p>
        </div>

        <div className="bg-zinc-800 rounded-xl p-4 mb-6">
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
        </div>

        <div className="flex gap-4 mb-8">
          <button
            className="bg-red-500 px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition"
            onClick={handleWarnUser}
          >
            Warn User
          </button>

          <button className="bg-blue-500 px-4 py-2 rounded-xl font-semibold hover:bg-blue-600 transition">
            Add Note
          </button>
        </div>

        <div>
          <h3 className="text-xl font-semibold mb-3">Warning History</h3>
          {warnings.length === 0 ? (
            <p className="text-zinc-400">No warnings issued yet.</p>
          ) : (
            <ul className="space-y-3">
              {warnings.map((warning, index) => (
                <li
                  key={`${warning.timestamp}-${index}`}
                  className="bg-zinc-800 rounded-xl p-4 flex flex-col gap-1"
                >
                  <span className="text-sm text-zinc-400">
                    {warning.timestamp}
                  </span>
                  <span className="text-base font-medium">
                    {warning.reason}
                  </span>
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
