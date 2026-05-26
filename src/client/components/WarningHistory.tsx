import type { Severity, WarningEntry } from '../../shared/api';

type WarningHistoryProps = {
  warnings: WarningEntry[];
  severityStyles: Record<Severity, string>;
};

export const WarningHistory = ({ warnings, severityStyles }: WarningHistoryProps) => {
  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-2xl p-6 backdrop-blur">
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
              <span className="text-base font-medium">{warning.reason}</span>
              <span className="text-xs text-zinc-400">
                Issued by {warning.moderator}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
