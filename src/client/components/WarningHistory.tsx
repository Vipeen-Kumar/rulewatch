import type { Severity, WarningEntry } from '../../shared/api';

type WarningHistoryProps = {
  warnings: WarningEntry[];
  severityStyles: Record<Severity, string>;
};

export const WarningHistory = ({ warnings, severityStyles }: WarningHistoryProps) => {
  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur">
      <h3 className="text-lg font-semibold mb-3 sm:text-xl sm:mb-4">Warning History</h3>
      {warnings.length === 0 ? (
        <p className="text-xs text-zinc-400 sm:text-sm">No warnings issued yet.</p>
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {warnings.map((warning, index) => (
            <li
              key={`${warning.timestamp}-${index}`}
              className="bg-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 sm:text-sm">
                  {warning.timestamp}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] border sm:text-xs sm:py-1 ${
                    severityStyles[warning.severity]
                  }`}
                >
                  {warning.severity}
                </span>
              </div>
              <span className="text-sm font-medium sm:text-base">{warning.reason}</span>
              <span className="text-[10px] text-zinc-400 sm:text-xs">
                Issued by {warning.moderator}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
