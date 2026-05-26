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
    <div className="bg-gradient-to-br from-zinc-900/80 via-zinc-900/95 to-zinc-950/90 border border-white/10 rounded-2xl p-6 backdrop-blur">
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
                <span className="text-sm text-zinc-400">{item.timestamp}</span>
                <span className="text-xs uppercase tracking-wide text-zinc-300">
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
              ) : item.kind === 'note' ? (
                <div className="space-y-1">
                  <span className="text-base font-medium">{item.note}</span>
                  <span className="text-xs text-zinc-400">
                    Added by {item.moderator}
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <span className="text-base font-medium">{item.message}</span>
                  <span className="text-xs text-zinc-400">
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
