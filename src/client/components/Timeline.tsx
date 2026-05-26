import type { NoteEntry, Severity, TimelineEvent, WarningEntry } from '../../shared/api';

type TimelineProps = {
  warnings: WarningEntry[];
  notes: NoteEntry[];
  events: TimelineEvent[];
  severityStyles: Record<Severity, string>;
};

type TimelineItem =
  | (WarningEntry & { kind: 'warning' })
  | (NoteEntry & { kind: 'note' })
  | (TimelineEvent & { kind: 'event' });

const buildTimelineItems = (
  warnings: WarningEntry[],
  notes: NoteEntry[],
  events: TimelineEvent[]
) => {
  const warningItems: TimelineItem[] = warnings.map((warning) => ({
    ...warning,
    kind: 'warning',
  }));

  const noteItems: TimelineItem[] = notes.map((note) => ({
    ...note,
    kind: 'note',
  }));

  const eventItems: TimelineItem[] = events.map((event) => ({
    ...event,
    kind: 'event',
  }));

  return [...eventItems, ...warningItems, ...noteItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
};

export const Timeline = ({ warnings, notes, events, severityStyles }: TimelineProps) => {
  const timelineItems = buildTimelineItems(warnings, notes, events);

  return (
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 backdrop-blur">
      <h3 className="text-lg font-semibold mb-3 sm:text-xl sm:mb-4">Moderation Timeline</h3>
      {timelineItems.length === 0 ? (
        <p className="text-xs text-zinc-400 sm:text-sm">No activity yet.</p>
      ) : (
        <ul className="space-y-2 sm:space-y-3">
          {timelineItems.map((item, index) => (
            <li
              key={`${item.timestamp}-${index}`}
              className="bg-zinc-800 rounded-lg sm:rounded-xl p-3 sm:p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-400 sm:text-sm">
                  {item.timestamp}
                </span>
                <span className="text-[10px] uppercase tracking-wide text-zinc-300 sm:text-xs">
                  {item.kind === 'warning'
                    ? 'Warning'
                    : item.kind === 'note'
                    ? 'Note'
                    : 'Event'}
                </span>
              </div>
              {item.kind === 'warning' ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium sm:text-base">
                      {item.reason}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] border sm:text-xs sm:py-1 ${
                        severityStyles[item.severity]
                      }`}
                    >
                      {item.severity}
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400 sm:text-xs">
                    Issued by {item.moderator}
                  </span>
                </div>
              ) : item.kind === 'note' ? (
                <div className="space-y-1">
                  <span className="text-sm font-medium sm:text-base">{item.note}</span>
                  <span className="text-[10px] text-zinc-400 sm:text-xs">
                    Added by {item.moderator}
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-sm font-medium sm:text-base">{item.message}</span>
                  <span className="text-[10px] text-zinc-400 sm:text-xs">
                    {item.actor}
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
