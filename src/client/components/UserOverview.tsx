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
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6 backdrop-blur">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold mb-1 sm:text-2xl sm:mb-2">User Overview</h2>
          <p className="text-xs text-zinc-400 sm:text-sm">
            Live case status and account snapshot.
          </p>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg sm:rounded-xl px-3 py-2 sm:px-4 sm:py-3">
          <p className="text-[10px] text-zinc-400 mb-1 sm:text-xs">Case Status</p>
          <select
            className="bg-transparent text-white text-xs font-semibold focus:outline-none sm:text-sm"
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
            <p className="text-[10px] text-red-300 mt-2 sm:text-xs">{statusError}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-2 sm:gap-3 sm:grid-cols-2">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between sm:block">
          <div>
            <p className="text-xs text-zinc-400">Username</p>
            <p className="text-sm font-semibold sm:text-lg">{displayUsername}</p>
          </div>
          <p className="text-[10px] text-zinc-400 sm:text-xs">Age {accountAge}</p>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex items-center justify-between sm:block">
          <div>
            <p className="text-xs text-zinc-400">Warnings</p>
            <p className="text-sm font-semibold sm:text-lg">{warningsCount}</p>
          </div>
          <p className="text-[10px] text-zinc-400 sm:text-xs">Karma {totalKarma}</p>
        </div>
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 sm:col-span-2">
          <p className="text-xs text-zinc-400 sm:text-sm">Last Warning</p>
          <p className="text-sm font-semibold sm:text-lg">
            {lastWarning ? lastWarning.reason : 'No warnings yet'}
          </p>
        </div>
      </div>

      <div className="border-t border-zinc-800 pt-4 sm:pt-6">
        <h3 className="text-base font-semibold mb-2 sm:text-lg sm:mb-3">
          User Risk Score
        </h3>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs text-zinc-400 sm:text-sm">Risk Level</span>
            <span className="text-xs font-semibold sm:text-sm">{riskStatus.label}</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className={`h-full ${riskStatus.color} ${riskStatus.width}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
