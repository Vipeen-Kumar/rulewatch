export type Severity = 'Low' | 'Medium' | 'High';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type BanRecommendation = 'None' | 'Temporary' | 'Permanent';

export type CaseStatus =
  | 'Open'
  | 'Under Review'
  | 'Escalated'
  | 'Resolved'
  | 'Banned';

export type TimelineEventType =
  | 'warning_added'
  | 'note_added'
  | 'case_cleared'
  | 'status_changed'
  | 'summary_generated'
  | 'scan_completed';

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  timestamp: string;
  message: string;
  actor: string;
};

export type LoadCaseStatusResponse = {
  type: 'case_status';
  status: CaseStatus;
};

export type SaveCaseStatusRequest = {
  status: CaseStatus;
};

export type SaveCaseStatusResponse = {
  type: 'case_status_saved';
  status: CaseStatus;
};

export type LoadTimelineResponse = {
  type: 'timeline';
  events: TimelineEvent[];
};

export type AppendTimelineRequest = {
  event: TimelineEvent;
};

export type AppendTimelineResponse = {
  type: 'timeline_saved';
  events: TimelineEvent[];
};

export type ScanFlag =
  | 'spam'
  | 'scam'
  | 'toxicity'
  | 'harassment'
  | 'nsfw_bait'
  | 'promotion';

export type ScanRecommendedAction =
  | 'No Action'
  | 'Watch User'
  | 'Send Warning'
  | 'Temporary Ban'
  | 'Permanent Ban';

export type PostScanResult = {
  postId: string;
  title: string;
  body: string;
  author: string;
  subreddit: string;
  createdAt: string;
  riskScore: number;
  confidence: number;
  recommendedAction: ScanRecommendedAction;
  summary: string;
  flags: ScanFlag[];
  keywordHits: {
    spam: number;
    scam: number;
    toxicity: number;
    harassment: number;
    nsfw: number;
    promotion: number;
  };
  accountAgeDays: number;
  karma: number;
  postingFrequency: number;
};

export type LoadScanResultResponse = {
  type: 'scan_result';
  result: PostScanResult;
};

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

export type UserSearchMetadata = {
  karma?: number;
  accountAgeDays?: number;
};

export type UserSearchResponse = {
  type: 'user_search';
  users: string[];
  meta?: Record<string, UserSearchMetadata>;
};

export type CurrentAuthorResponse = {
  type: 'current_author';
  author: string;
  postId: string;
  postTitle: string;
};

export type TargetPostResponse = {
  type: 'target_post';
  postId: string;
  postIdFull: string;
  author: string;
  title: string;
  body: string;
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
