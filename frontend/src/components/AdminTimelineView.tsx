import React, { useState, useEffect } from 'react';
import { Title, TimelineEvent } from '../types';
import { api } from '../services/api';
import { Shield, CheckCircle2, AlertTriangle, Upload, Eye, FileText } from 'lucide-react';

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
      setStatusMessage('Timeline successfully published to PostgreSQL database!');
      setValidationResult({ valid: true, totalEvents: res.events.length, errors: [] });
    } catch (err: any) {
      setStatusMessage(`Upload failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '32px 48px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
        <Shield size={28} color="#E50914" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>Admin Timeline Management & Schema Validation</h1>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '28px' }}>
        Author, validate, and publish timestamp-keyed scene markers, character metadata, glossary items, and narrative variation branches.
      </p>

      {/* Title Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Title:</label>
        <select
          value={selectedTitleId}
          onChange={(e) => setSelectedTitleId(e.target.value)}
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'white',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '0.9rem'
          }}
        >
          {titles.map((t) => (
            <option key={t.id} value={t.id} style={{ background: '#1c1c1c' }}>
              {t.name} ({t.durationSeconds}s)
            </option>
          ))}
        </select>
      </div>

      {/* Editor & Preview Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Left: JSON Input */}
        <div className="glass-panel" style={{ borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem' }}>
              <FileText size={18} color="#00F0FF" /> Timeline Schema JSON
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleValidate}
                className="btn-secondary"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                Validate Schema
              </button>
              <button
                onClick={handleUpload}
                className="btn-netflix"
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                <Upload size={14} /> Publish Timeline
              </button>
            </div>
          </div>

          <textarea
            value={timelineJson}
            onChange={(e) => setTimelineJson(e.target.value)}
            style={{
              flex: 1,
              minHeight: '480px',
              backgroundColor: '#0a0a0a',
              color: '#00F0FF',
              fontFamily: 'monospace',
              fontSize: '0.85rem',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              outline: 'none',
              resize: 'vertical'
            }}
          />

          {statusMessage && (
            <div style={{
              marginTop: '12px',
              padding: '10px 14px',
              borderRadius: '6px',
              fontSize: '0.85rem',
              background: validationResult?.valid ? 'rgba(0, 255, 102, 0.1)' : 'rgba(229, 9, 20, 0.1)',
              border: validationResult?.valid ? '1px solid #00FF66' : '1px solid #E50914',
              color: validationResult?.valid ? '#00FF66' : '#FF4D4D'
            }}>
              {statusMessage}
              {validationResult?.errors && validationResult.errors.length > 0 && (
                <ul style={{ marginTop: '6px', paddingLeft: '20px', fontSize: '0.8rem' }}>
                  {validationResult.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Authored Markers Preview */}
        <div className="glass-panel" style={{ borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.95rem', marginBottom: '16px' }}>
            <Eye size={18} color="#FBBF24" /> Live Database Timeline ({existingEvents.length} events)
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '540px', overflowY: 'auto' }}>
            {existingEvents.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '40px' }}>
                No authored timeline events found for this title.
              </div>
            ) : (
              existingEvents.map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '8px',
                    padding: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      textTransform: 'uppercase',
                      color: ev.type === 'trivia' ? '#00F0FF' : (ev.type === 'variation_point' ? '#FF4D4D' : '#FBBF24')
                    }}>
                      {ev.type}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      ts: {ev.ts}s
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#E5E7EB' }}>
                    {ev.text || ev.payload?.text || ev.payload?.name || ev.payload?.term || ev.payload?.prompt || JSON.stringify(ev.payload || {})}
                  </div>
                  {ev.options && ev.options.length > 0 && (
                    <div style={{ marginTop: '8px', paddingLeft: '8px', borderLeft: '2px solid #E50914' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Options:</div>
                      {ev.options.map(opt => (
                        <div key={opt.id} style={{ fontSize: '0.75rem', color: '#dedede' }}>
                          • {opt.label} ({opt.assetRef})
                        </div>
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
  );
};
