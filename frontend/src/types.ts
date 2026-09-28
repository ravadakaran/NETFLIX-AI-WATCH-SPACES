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
  voteCount?: number;
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
