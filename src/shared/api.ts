export type Severity = 'Low' | 'Medium' | 'High';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type BanRecommendation = 'None' | 'Temporary' | 'Permanent';

export type RecentPost = {
  id: string;
  title: string;
  createdAt: string;
  permalink: string;
  subredditName: string;
  score: number;
  removed: boolean;
  spam: boolean;
};

export type RecentComment = {
  id: string;
  body: string;
  createdAt: string;
  permalink: string;
  subredditName: string;
  score: number;
  removed: boolean;
  spam: boolean;
};

export type UserRiskAnalysis = {
  spamRisk: RiskLevel;
  harassmentRisk: RiskLevel;
  banRecommendation: BanRecommendation;
  suspiciousPatterns: string[];
};

export type UserProfile = {
  username: string;
  createdAt: string;
  linkKarma: number;
  commentKarma: number;
  totalKarma: number;
  recentPosts: RecentPost[];
  recentComments: RecentComment[];
  risk: UserRiskAnalysis;
};

export type UserProfileResponse = {
  type: 'user_profile';
  profile: UserProfile;
};

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
