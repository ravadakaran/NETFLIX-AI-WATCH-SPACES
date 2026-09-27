import React, { useState, useEffect } from 'react';
import { Title, TimelineEvent } from '../types';
import { api } from '../services/api';

interface AdminTimelineViewProps {
  titles: Title[];
}

export const AdminTimelineView: React.FC<AdminTimelineViewProps> = ({ titles }) => {
  const [selectedTitleId, setSelectedTitleId] = useState<string>(titles[0]?.id || '');
  const [timelineJson, setTimelineJson] = useState<string>('');
  const [validationResult, setValidationResult] = useState<{
    valid?: boolean;
    totalEvents?: number;
    errors?: string[];
  } | null>(null);
  const [existingEvents, setExistingEvents] = useState<TimelineEvent[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTitleId) {
      loadExistingTimeline(selectedTitleId);
    }
  }, [selectedTitleId]);

  const loadExistingTimeline = async (titleId: string) => {
    try {
      const res = await api.getTimeline(titleId);
      setExistingEvents(res.events || []);

      const sampleUpload = {
        titleId: titleId,
        version: "1.0",
        events: res.events?.map(e => ({
          ts: e.ts,
          type: e.type,
          payload: e.payload || { text: e.text || "Event sample" },
          options: e.options || undefined
        })) || []
      };
      setTimelineJson(JSON.stringify(sampleUpload, null, 2));
    } catch (e) {
      console.error(e);
    }
  };

  const handleValidate = async () => {
    try {
      const parsed = JSON.parse(timelineJson);
      const res = await api.validateTimeline(selectedTitleId, parsed);
      setValidationResult(res);
      setStatusMessage(res.valid ? `Validation Passed: ${res.totalEvents} valid events` : 'Validation Failed: Fix reported errors');
    } catch (err: any) {
      setValidationResult({
        valid: false,
        totalEvents: 0,
        errors: [`JSON Parse Error: ${err.message}`]
      });
      setStatusMessage('Invalid JSON format');
    }
  };

  const handleUpload = async () => {
    try {
      const parsed = JSON.parse(timelineJson);
      const res = await api.uploadTimeline(selectedTitleId, parsed);
      setExistingEvents(res.events || []);
      setStatusMessage(`Successfully committed ${res.events?.length || 0} events to backend database!`);
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div className="w-full px-4 sm:px-8 lg:px-14 max-w-7xl mx-auto pt-10 pb-24 text-on-surface">
      <div className="space-y-1 mb-8">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-secondary shadow-[0_0_8px_#f3bd79]" />
          <span className="font-label-sm text-[10px] tracking-[0.2em] uppercase text-secondary font-semibold">
            SYSTEM TELEMETRY & SCHEMA INGESTION
          </span>
        </div>
        <h1 className="font-display-lg text-3xl sm:text-5xl text-white font-bold tracking-tight">
          Admin Timeline & Variation Engine
        </h1>
        <p className="font-body-md text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
          Validate and upload schema-compliant JSON timelines (trivia, character dossiers, glossary items, and narrative variation branch points) for authoritative synchronization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Editor & Schema Tools */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-3xl bg-surface-container-low border border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider font-label-md">
                Target Cinema Title
              </label>
              <span className="font-mono text-xs text-secondary font-bold">
                {existingEvents.length} Events Ingested
              </span>
            </div>
            <select
              value={selectedTitleId}
              onChange={(e) => setSelectedTitleId(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-secondary"
            >
              {titles.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.id})
                </option>
              ))}
            </select>
          </div>

          <div className="p-6 rounded-3xl bg-surface-container-low border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-white uppercase tracking-wider font-label-md">
                Timeline Schema Payload (JSON)
              </label>
              <button
                type="button"
                onClick={() => loadExistingTimeline(selectedTitleId)}
                className="text-[10px] text-secondary hover:underline uppercase"
              >
                Reload Existing
              </button>
            </div>
            <textarea
              rows={16}
              value={timelineJson}
              onChange={(e) => setTimelineJson(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-2xl p-4 text-xs font-mono text-white/90 focus:outline-none focus:border-secondary"
            />

            {statusMessage && (
              <div className="p-3 rounded-xl bg-surface-container-lowest border border-secondary/30 text-xs text-secondary font-mono">
                {statusMessage}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleValidate}
                className="px-6 py-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-white font-label-md text-xs uppercase tracking-wider font-bold border border-white/10 transition-colors"
              >
                Validate Schema
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] via-[#7C3AED] to-[#EC4899] text-white font-label-md text-xs uppercase tracking-wider font-bold shadow-[0_0_20px_rgba(139,92,246,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.7)] transition-all"
              >
                Upload to Neon DB
              </button>
            </div>
          </div>
        </div>

        {/* Right: Validation Inspector & Active Events Feed */}
        <div className="lg:col-span-5 space-y-6">
          {validationResult && (
            <div className={`p-6 rounded-3xl border ${validationResult.valid ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-error/10 border-error/30'} space-y-2`}>
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-xs uppercase font-bold tracking-wider">
                  Validation Status: {validationResult.valid ? 'PASS' : 'FAIL'}
                </span>
                <span className="font-mono text-xs font-bold">
                  {validationResult.totalEvents || 0} valid events
                </span>
              </div>
              {validationResult.errors && validationResult.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validationResult.errors.map((err, i) => (
                    <div key={i} className="text-xs text-error font-mono">
                      • {err}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="p-6 rounded-3xl bg-surface-container-low border border-white/5 space-y-4">
            <h3 className="font-title-md text-sm text-white font-bold uppercase tracking-wider">
              Ingested Timeline Events ({existingEvents.length})
            </h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {existingEvents.length === 0 ? (
                <div className="py-8 text-center text-xs text-on-surface-variant">
                  No timeline events found for this title.
                </div>
              ) : (
                existingEvents.map((evt, idx) => (
                  <div
                    key={evt.id || idx}
                    className="p-3.5 rounded-2xl bg-surface-container-lowest border border-white/5 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="px-2 py-0.5 rounded bg-primary-container/20 text-primary-fixed-dim uppercase font-semibold font-mono">
                        {evt.type}
                      </span>
                      <span className="font-mono text-secondary font-bold">
                        {Math.floor(evt.ts / 60)}:{(evt.ts % 60).toString().padStart(2, '0')} ({evt.ts}s)
                      </span>
                    </div>
                    <div className="text-xs text-white">
                      {evt.text || evt.definition || (evt.payload && JSON.stringify(evt.payload))}
                    </div>
                    {evt.options && (
                      <div className="pt-1 flex flex-wrap gap-1">
                        {evt.options.map((opt) => (
                          <span
                            key={opt.id}
                            className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-on-surface-variant font-mono"
                          >
                            Choice: {opt.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
