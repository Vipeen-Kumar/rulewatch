import type { CaseStatus, WarningEntry } from '../../shared/api';

type RiskStatus = {
  label: string;
  color: string;
  width: string;
};

type UserOverviewProps = {
  displayUsername: string;
  accountAge: string;
  warningsCount: number;
  totalKarma: number;
  lastWarning: WarningEntry | undefined;
  riskStatus: RiskStatus;
  caseStatus: CaseStatus;
  isStatusLoading: boolean;
  statusError: string | null;
  onStatusChange: (status: CaseStatus) => void;
};

const caseStatusOptions: CaseStatus[] = [
  'Open',
  'Under Review',
  'Escalated',
  'Resolved',
  'Banned',
];

export const UserOverview = ({
  displayUsername,
  accountAge,
  warningsCount,
  totalKarma,
  lastWarning,
  riskStatus,
  caseStatus,
  isStatusLoading,
  statusError,
  onStatusChange,
}: UserOverviewProps) => {
  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-2xl p-6 space-y-6 backdrop-blur">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">User Overview</h2>
          <p className="text-sm text-zinc-400">
            Live case status and account snapshot.
          </p>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl px-4 py-3">
          <p className="text-xs text-zinc-400 mb-1">Case Status</p>
          <select
            className="bg-transparent text-white text-sm font-semibold focus:outline-none"
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
          {statusError ? (
            <p className="text-xs text-red-300 mt-2">{statusError}</p>
          ) : null}
        </div>
      </div>

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
  );
};
