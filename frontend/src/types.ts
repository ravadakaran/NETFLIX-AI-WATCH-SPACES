export type UserRole = 'VIEWER' | 'HOST' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  subtitleLocale?: string;
  avatarUrl?: string;
  profileImage?: string;
}

export interface Title {
  id: string;
  name: string;
  durationSeconds: number;
  videoAssetUrl: string;
  description?: string;
  genre?: string;
  thumbnailUrl?: string;
}

export interface VariationOption {
  id: string;
  label: string;
  assetRef?: string;
  nextVariationId?: string;
  segmentStartSeconds?: number;
  segmentEndSeconds?: number;
  resumeSeconds?: number;
  voteCount?: number;
}

export type NarrativeCardKind = 'variation' | 'prediction' | 'trivia';

export interface NarrativeChoice {
  id: string;
  label: string;
  assetRef?: string;
  nextVariationId?: string;
  segmentStartSeconds?: number;
  segmentEndSeconds?: number;
  resumeSeconds?: number;
  voteCount: number;
}

export interface NarrativeCard {
  eventId: string;
  variationId?: string;
  prompt: string;
  kind: NarrativeCardKind;
  ts: number;
  options: NarrativeChoice[];
}

export interface NarrativeRound extends NarrativeCard {
  closesAt: number;
  resolvesAt: number;
  myOptionId?: string | null;
}

export interface NarrativeDecision {
  id: string;
  eventId: string;
  variationId: string;
  prompt: string;
  optionId: string;
  label: string;
  assetRef?: string;
  nextVariationId?: string;
  votes: Record<string, number>;
  decidedAt: number;
  sequence: number;
}

export interface NarrativeSegment {
  decisionId: string;
  url: string;
  startSeconds: number;
  endSeconds: number | null;
  resumeSeconds: number;
  startedAt: number;
}

export interface NarrativeScore {
  userId: string;
  displayName: string;
  points: number;
  correct: number;
  answered: number;
  accuracy: number;
  badges: string[];
}

export interface NarrativeResult {
  eventId: string;
  prompt: string;
  kind: NarrativeCardKind;
  correctOptionId: string;
  correctLabel: string;
  resolvedAt: number;
}

export interface NarrativeState {
  version: number;
  availableVotes: NarrativeCard[];
  availablePredictions: NarrativeCard[];
  activeVote: NarrativeRound | null;
  activePrediction: NarrativeRound | null;
  history: NarrativeDecision[];
  completedPredictions: NarrativeResult[];
  leaderboard: NarrativeScore[];
  activeSegment: NarrativeSegment | null;
  baseResumeSeconds: number | null;
}

// Contract aliases keep the wire names available to feature consumers.
export type Choice = NarrativeChoice;
export type Card = NarrativeCard;
export type Round = NarrativeRound;
export type Decision = NarrativeDecision;
export type Segment = NarrativeSegment;
export type Score = NarrativeScore;
export type Result = NarrativeResult;

export type NarrativeAction =
  | 'openVote'
  | 'castVote'
  | 'resolveVote'
  | 'openPrediction'
  | 'answerPrediction'
  | 'resolvePrediction'
  | 'finishSegment';

export interface NarrativeActionInput {
  action: NarrativeAction;
  eventId?: string;
  optionId?: string;
  decisionId?: string;
}

export interface TimelineEvent {
  id: string;
  ts: number;
  type: 'trivia' | 'character' | 'glossary' | 'variation_point' | string;
  text?: string;
  characterId?: string;
  term?: string;
  definition?: string;
  variationId?: string;
  payload?: any;
  options?: VariationOption[];
}

export interface Participant {
  userId: string;
  displayName: string;
  email: string;
  joinedAt: string;
  isHost: boolean;
}

export interface WatchSpace {
  watchSpaceId: string;
  titleId: string;
  titleName: string;
  videoAssetUrl: string;
  durationSeconds: number;
  inviteCode: string;
  status: 'SCHEDULED' | 'LIVE' | 'ENDED';
  hostUserId: string;
  hostDisplayName: string;
  maxParticipants: number;
  activeParticipantsCount: number;
  aiVerbosity: string;
  votingEnabled: boolean;
  playbackState: 'play' | 'pause' | 'seek' | string;
  positionSeconds: number;
  isLocked?: boolean;
  createdAt: string;
  endedAt?: string;
  participants: Participant[];
}

export interface ChatMessage {
  id: string;
  userId?: string;
  displayName?: string;
  msgType: 'chat' | 'ai_answer' | 'system';
  body: string;
  tsSeconds?: number;
  createdAt?: string;
  sourceEvents?: string[];
}

export interface RecommendationItem {
  titleId: string;
  title: string;
  genre: string;
  thumbnailUrl: string;
  description: string;
  score: number;
  reason: string;
}

export interface HistoryItem {
  id: string;
  titleId: string;
  titleName: string;
  thumbnailUrl: string;
  watchedSeconds: number;
  durationSeconds: number;
  completed: boolean;
  rating?: number;
  watchedAt: string;
}

export interface Analytics {
  watchSpaceId: string;
  sessionDurationSeconds: number;
  peakParticipants: number;
  currentParticipants: number;
  aiQuestionsCount: number;
  triviaCardsSurfacedCount: number;
  chatMessagesCount: number;
  variationVotesCount: number;
}
