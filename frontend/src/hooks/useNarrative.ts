import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { NarrativeAction, NarrativeActionInput, NarrativeState } from '../types';
import { WatchSpaceSocket } from '../services/websocket';

const emptyState = (): NarrativeState => ({
  version: 0,
  availableVotes: [],
  availablePredictions: [],
  activeVote: null,
  activePrediction: null,
  history: [],
  completedPredictions: [],
  leaderboard: [],
  activeSegment: null,
  baseResumeSeconds: null
});

function normalizeState(value: NarrativeState | null | undefined): NarrativeState {
  const state = value || emptyState();
  return {
    ...emptyState(),
    ...state,
    availableVotes: Array.isArray(state.availableVotes) ? state.availableVotes : [],
    availablePredictions: Array.isArray(state.availablePredictions) ? state.availablePredictions : [],
    history: Array.isArray(state.history) ? state.history : [],
    completedPredictions: Array.isArray(state.completedPredictions) ? state.completedPredictions : [],
    leaderboard: Array.isArray(state.leaderboard) ? state.leaderboard : []
  };
}

/**
 * Narrative state is server authoritative. WebSocket messages are public and
 * therefore do not contain myOptionId; keep that private value across a
 * broadcast and refresh it from GET/POST responses.
 */
function mergePublicState(nextValue: NarrativeState, previous: NarrativeState | null): NarrativeState {
  const next = normalizeState(nextValue);
  if (!previous || next.version < previous.version) return next;

  const activeVote = next.activeVote && previous.activeVote &&
    next.activeVote.eventId === previous.activeVote.eventId
    ? { ...next.activeVote, myOptionId: previous.activeVote.myOptionId }
    : next.activeVote;
  const activePrediction = next.activePrediction && previous.activePrediction &&
    next.activePrediction.eventId === previous.activePrediction.eventId
    ? { ...next.activePrediction, myOptionId: previous.activePrediction.myOptionId }
    : next.activePrediction;

  return { ...next, activeVote, activePrediction };
}

export interface NarrativeController {
  state: NarrativeState | null;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  actionInFlight: NarrativeAction | null;
  refresh: () => Promise<void>;
  act: (input: NarrativeActionInput) => Promise<NarrativeState>;
}

export function useNarrative(
  spaceId: string,
  socket: WatchSpaceSocket | null,
  connectionSignal = 0
): NarrativeController {
  const [state, setState] = useState<NarrativeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<NarrativeAction | null>(null);
  const stateRef = useRef<NarrativeState | null>(null);

  const applyGetState = useCallback((next: NarrativeState) => {
    const normalized = normalizeState(next);
    if (stateRef.current && normalized.version < stateRef.current.version) return;
    stateRef.current = normalized;
    setState(normalized);
    setError(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const next = await api.getNarrativeState(spaceId);
      applyGetState(next);
    } catch (err: any) {
      setError(err?.message || 'Narrative state could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [applyGetState, spaceId]);

  const act = useCallback(async (input: NarrativeActionInput) => {
    setActionInFlight(input.action);
    setActionError(null);
    try {
      const next = await api.narrativeAction(spaceId, input);
      applyGetState(next);
      return normalizeState(next);
    } catch (err: any) {
      const message = err?.message || 'The narrative action was rejected.';
      setActionError(message);
      throw err;
    } finally {
      setActionInFlight(null);
    }
  }, [applyGetState, spaceId]);

  useEffect(() => {
    stateRef.current = null;
    setState(null);
    setLoading(true);
    setError(null);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!socket) return;

    const unsubscribe = socket.subscribe('room.narrative.state', (message) => {
      const publicState = message.payload as NarrativeState;
      if (!publicState || typeof publicState !== 'object') return;
      const merged = mergePublicState(publicState, stateRef.current);
      stateRef.current = merged;
      setState(merged);
      setError(null);
      setLoading(false);
    });

    return unsubscribe;
  }, [socket]);

  // This is also the reconnect safety net. The connection signal is bumped
  // by WatchRoom's socket onOpen callback, including automatic reconnects.
  useEffect(() => {
    void refresh();
  }, [connectionSignal, refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refresh();
    }, 3000);
    return () => window.clearInterval(interval);
  }, [refresh]);

  return { state, loading, error, actionError, actionInFlight, refresh, act };
}
