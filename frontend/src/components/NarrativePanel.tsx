import React, { useEffect, useState } from 'react';
import {
  NarrativeAction,
  NarrativeCard,
  NarrativeRound,
  NarrativeState
} from '../types';

interface NarrativePanelProps {
  state: NarrativeState | null;
  loading: boolean;
  error: string | null;
  actionError: string | null;
  actionInFlight: NarrativeAction | null;
  isHost: boolean;
  currentTime: number;
  onAction: (action: NarrativeAction, values?: { eventId?: string; optionId?: string; decisionId?: string }) => void;
}

const formatCountdown = (timestamp: number, now: number) => {
  const remaining = Math.max(0, timestamp - now);
  const seconds = Math.ceil(remaining / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
};

const isTimeGated = (card: NarrativeCard, currentTime: number) => currentTime + 0.5 < card.ts;

const CardButton: React.FC<{
  card: NarrativeCard;
  currentTime: number;
  disabled: boolean;
  onOpen: () => void;
}> = ({ card, currentTime, disabled, onOpen }) => {
  const gated = isTimeGated(card, currentTime);
  return (
    <div className="rounded-xl bg-[#0D1535]/75 border border-white/10 p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-pink-300 font-bold">
            {card.kind === 'variation' ? 'Narrative fork' : card.kind === 'trivia' ? 'Trivia prediction' : 'Prediction'}
          </div>
          <p className="text-xs text-white leading-relaxed mt-1">{card.prompt}</p>
        </div>
        <span className="text-[10px] text-on-surface-variant font-mono whitespace-nowrap">
          {gated ? `at ${Math.floor(card.ts / 60)}:${String(Math.floor(card.ts % 60)).padStart(2, '0')}` : 'ready'}
        </span>
      </div>
      <button
        type="button"
        disabled={disabled || gated}
        onClick={onOpen}
        className="w-full rounded-lg px-3 py-2 text-[10px] uppercase tracking-wider font-bold border border-violet-400/30 text-violet-200 hover:bg-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {gated ? 'Waiting for scene' : 'Open card'}
      </button>
    </div>
  );
};

const LiveRound: React.FC<{
  round: NarrativeRound;
  now: number;
  isHost: boolean;
  actionInFlight: NarrativeAction | null;
  onAction: NarrativePanelProps['onAction'];
}> = ({ round, now, isHost, actionInFlight, onAction }) => {
  const total = round.options.reduce((sum, option) => sum + (option.voteCount || 0), 0);
  const answerAction: NarrativeAction = round.kind === 'variation' ? 'castVote' : 'answerPrediction';
  const resolveAction: NarrativeAction = round.kind === 'variation' ? 'resolveVote' : 'resolvePrediction';
  const closed = now >= round.closesAt;
  const resolutionPending = closed && round.kind !== 'variation' && now < round.resolvesAt;
  const countdownTarget = resolutionPending ? round.resolvesAt : round.closesAt;

  return (
    <div className="rounded-xl bg-gradient-to-br from-violet-950/70 to-[#0D1535]/90 border border-pink-500/30 p-3 space-y-3 shadow-[0_8px_26px_rgba(139,92,246,0.15)]">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-[9px] uppercase tracking-[0.18em] text-pink-300 font-bold">
            Live {round.kind === 'variation' ? 'vote' : 'prediction'}
          </div>
          <p className="text-xs text-white font-semibold mt-1">{round.prompt}</p>
        </div>
        <div className={`text-[10px] font-mono whitespace-nowrap ${closed ? 'text-amber-300' : 'text-cyan-300'}`}>
          {resolutionPending ? `${formatCountdown(countdownTarget, now)} to score` : closed ? 'closed' : `${formatCountdown(countdownTarget, now)} left`}
        </div>
      </div>

      <div className="space-y-2">
        {round.options.map(option => {
          const selected = round.myOptionId === option.id;
          const percent = total > 0 ? Math.round((option.voteCount / total) * 100) : 0;
          return (
            <button
              type="button"
              key={option.id}
              disabled={!!round.myOptionId || closed || !!actionInFlight}
              onClick={() => onAction(answerAction, { eventId: round.eventId, optionId: option.id })}
              className={`relative overflow-hidden w-full text-left rounded-lg border px-3 py-2 transition-colors disabled:cursor-not-allowed ${
                selected ? 'border-cyan-300/70 bg-cyan-400/15' : 'border-white/10 bg-[#080D24]/70 hover:border-violet-300/50'
              }`}
            >
              <span className="absolute inset-y-0 left-0 bg-violet-500/15" style={{ width: `${percent}%` }} />
              <span className="relative flex items-center justify-between gap-2 text-xs text-white">
                <span>{option.label}</span>
                <span className="text-[10px] font-mono text-pink-200">{option.voteCount || 0} · {percent}%</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-2 text-[10px] text-on-surface-variant">
        <span>{round.myOptionId ? 'Answer recorded' : round.kind === 'variation' ? 'Choose once' : 'Answer once'}</span>
        {isHost && (
          <button
            type="button"
            disabled={!!actionInFlight}
            onClick={() => onAction(resolveAction, { eventId: round.eventId })}
            className="rounded-md border border-pink-400/40 px-2 py-1 text-pink-200 hover:bg-pink-500/15 disabled:opacity-40"
          >
            {closed ? 'Resolve now' : 'Resolve early'}
          </button>
        )}
      </div>
    </div>
  );
};

export const NarrativePanel: React.FC<NarrativePanelProps> = ({
  state,
  loading,
  error,
  actionError,
  actionInFlight,
  isHost,
  currentTime,
  onAction
}) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  if (loading && !state) {
    return <div className="p-4 text-xs text-on-surface-variant">Loading live narrative state…</div>;
  }

  if (!state) {
    return (
      <div className="m-4 rounded-xl border border-pink-500/30 bg-pink-950/20 p-3 text-xs text-pink-200">
        {error || 'Narrative features are unavailable for this room.'}
      </div>
    );
  }

  const canOpen = isHost && !state.activeVote && !state.activePrediction && !actionInFlight;
  const predictions = state.availablePredictions;
  const votes = state.availableVotes;

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 select-text">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-pink-300 font-bold">Interactive story</div>
          <div className="text-[10px] text-on-surface-variant mt-1">Authoritative state v{state.version}</div>
        </div>
        <span className={`w-2 h-2 rounded-full ${error ? 'bg-amber-400' : 'bg-cyan-400'} shadow-[0_0_8px_currentColor]`} />
      </div>

      {(error || actionError) && (
        <div className="rounded-lg border border-amber-400/30 bg-amber-950/20 p-2.5 text-[10px] text-amber-200">
          {actionError || error}
        </div>
      )}

      {state.activeSegment && (
        <div className="rounded-xl border border-cyan-400/30 bg-cyan-950/20 p-3 text-xs text-cyan-100">
          <div className="text-[9px] uppercase tracking-[0.16em] font-bold text-cyan-300">Live branch segment</div>
          <div className="mt-1">Playing the majority path. The base story resumes at {Math.floor(state.activeSegment.resumeSeconds / 60)}:{String(Math.floor(state.activeSegment.resumeSeconds % 60)).padStart(2, '0')}.</div>
          {!/^https?:\/\//i.test(state.activeSegment.url) && (
            <div className="mt-2 text-amber-200">This legacy asset reference cannot be switched automatically.</div>
          )}
          {isHost && (
            <button
              type="button"
              disabled={!!actionInFlight}
              onClick={() => onAction('finishSegment', { decisionId: state.activeSegment!.decisionId })}
              className="mt-2 rounded-md border border-cyan-300/40 px-2 py-1 text-[10px] hover:bg-cyan-400/10 disabled:opacity-40"
            >
              Finish segment
            </button>
          )}
        </div>
      )}

      {state.activeVote && (
        <LiveRound round={state.activeVote} now={now} isHost={isHost} actionInFlight={actionInFlight} onAction={onAction} />
      )}
      {state.activePrediction && (
        <LiveRound round={state.activePrediction} now={now} isHost={isHost} actionInFlight={actionInFlight} onAction={onAction} />
      )}

      {isHost && !state.activeVote && !state.activePrediction && (
        <div className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant font-bold">Host deck</div>
          {votes.map(card => (
            <CardButton
              key={`vote-${card.eventId}`}
              card={card}
              currentTime={currentTime}
              disabled={!canOpen}
              onOpen={() => onAction('openVote', { eventId: card.eventId })}
            />
          ))}
          {predictions.map(card => (
            <CardButton
              key={`prediction-${card.eventId}`}
              card={card}
              currentTime={currentTime}
              disabled={!canOpen}
              onOpen={() => onAction('openPrediction', { eventId: card.eventId })}
            />
          ))}
          {votes.length === 0 && predictions.length === 0 && (
            <div className="rounded-xl border border-white/10 bg-[#0D1535]/60 p-3 text-[10px] text-on-surface-variant">
              No eligible narrative cards at this path yet.
            </div>
          )}
        </div>
      )}

      {!isHost && !state.activeVote && !state.activePrediction && (
        <div className="rounded-xl border border-white/10 bg-[#0D1535]/60 p-3 text-[10px] text-on-surface-variant">
          The host opens the next eligible story card when its scene timestamp arrives.
        </div>
      )}

      {state.completedPredictions.length > 0 && (
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant font-bold">Resolved answers</div>
          {state.completedPredictions.slice(0, 5).map(result => (
            <div key={`${result.eventId}-${result.resolvedAt}`} className="rounded-lg border border-emerald-400/20 bg-emerald-950/15 p-2.5">
              <div className="text-[10px] text-emerald-200 font-semibold">{result.prompt}</div>
              <div className="text-[10px] text-on-surface-variant mt-1">Answer: <span className="text-white">{result.correctLabel}</span></div>
            </div>
          ))}
        </section>
      )}

      {state.history.length > 0 && (
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant font-bold">Decision history</div>
          {state.history.slice().reverse().slice(0, 8).map(decision => (
            <div key={decision.id} className="rounded-lg border border-white/10 bg-[#0D1535]/55 p-2.5">
              <div className="text-[10px] text-white">{decision.prompt}</div>
              <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-violet-200">
                <span>{decision.label}</span>
                <span className="text-on-surface-variant">#{decision.sequence}</span>
              </div>
              {decision.assetRef && !/^https?:\/\//i.test(decision.assetRef) && (
                <div className="mt-1 text-[9px] text-on-surface-variant">Legacy asset: {decision.assetRef}</div>
              )}
            </div>
          ))}
        </section>
      )}

      {state.leaderboard.length > 0 && (
        <section className="space-y-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-on-surface-variant font-bold">Leaderboard & badges</div>
          {state.leaderboard.slice(0, 8).map((score, index) => (
            <div key={score.userId} className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0D1535]/55 p-2">
              <span className="w-5 text-[10px] text-pink-300 font-mono">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[10px] text-white">{score.displayName}</div>
                <div className="text-[9px] text-on-surface-variant">{score.correct}/{score.answered} correct · {Math.round(score.accuracy * 100)}%</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-cyan-200 font-mono">{score.points} pts</div>
                {score.badges.length > 0 && <div className="text-[9px] text-amber-200">{score.badges.join(' · ')}</div>}
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
