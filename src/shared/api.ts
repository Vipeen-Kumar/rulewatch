export type Severity = 'Low' | 'Medium' | 'High';

export type WarningEntry = {
  reason: string;
  timestamp: string;
  moderator: string;
  severity: Severity;
};

export type NoteEntry = {
  note: string;
  timestamp: string;
  moderator: string;
};

export type LoadWarningsResponse = {
  type: 'warnings';
  warnings: WarningEntry[];
};

export type SaveWarningsRequest = {
  warnings: WarningEntry[];
};

export type SaveWarningsResponse = {
  type: 'warnings_saved';
  warnings: WarningEntry[];
};

export type LoadNotesResponse = {
  type: 'notes';
  notes: NoteEntry[];
};

export type SaveNotesRequest = {
  notes: NoteEntry[];
};

export type SaveNotesResponse = {
  type: 'notes_saved';
  notes: NoteEntry[];
};

export type InitResponse = {
  type: 'init';
  postId: string;
  count: number;
  username: string;
};

export type IncrementResponse = {
  type: 'increment';
  postId: string;
  count: number;
};

export type DecrementResponse = {
  type: 'decrement';
  postId: string;
  count: number;
};
