/**
 * Artillery processor for Netflix AI Watch Spaces WebSocket stress test.
 * Simulates real viewer behavior, authenticates sessions, measures RTT/drift and fan-out latency.
 */
const crypto = require('crypto');

// Pre-seeded or dynamic JWT signing secret from application.yml
const JWT_SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';
const DEFAULT_SPACE_ID = process.env.WATCH_SPACE_ID || '11111111-1111-1111-1111-111111111111';

// In-memory metrics tracking for the test run
const metrics = {
  driftSamples: [],
  fanoutSamples: [],
  maxDriftMs: 0,
  maxFanoutMs: 0,
};

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Creates an HMAC-SHA256 JWT token compatible with Spring Boot JwtTokenProvider
 */
function createToken(userId, email, role = 'VIEWER') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: userId,
    email: email,
    role: role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  // If secret is hex encoded (64 chars = 32 bytes) or raw
  let keyBuffer;
  if (/^[0-9a-fA-F]{64}$/.test(JWT_SECRET)) {
    keyBuffer = Buffer.from(JWT_SECRET, 'hex');
  } else {
    keyBuffer = Buffer.from(JWT_SECRET, 'utf-8');
  }

  const hmac = crypto.createHmac('sha256', keyBuffer);
  hmac.update(signatureInput);
  const encodedSignature = hmac.digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

/**
 * Setup hook for each simulated user context
 */
function setupViewerSession(context, events, done) {
  const userNum = Math.floor(Math.random() * 100000);
  const userId = crypto.randomUUID();
  const email = `stress_viewer_${userNum}@netflix-spaces.test`;
  const token = createToken(userId, email, 'VIEWER');

  context.vars.watchSpaceId = DEFAULT_SPACE_ID;
  context.vars.token = token;
  context.vars.userId = userId;
  context.vars.userDisplayName = `StressViewer_${userNum}`;

  // Initial Ping envelope
  const pingEnvelope = {
    event: 'room.sync.ping',
    watchSpaceId: DEFAULT_SPACE_ID,
    payload: {
      clientSentAt: Date.now()
    },
    ts: Date.now()
  };
  context.vars.syncPingPayload = JSON.stringify(pingEnvelope);

  // Chat envelope
  const chatEnvelope = {
    event: 'room.chat.message',
    watchSpaceId: DEFAULT_SPACE_ID,
    payload: {
      body: `Stress test latency check #${userNum} - stream crystal clear!`,
      tsSeconds: 15.0
    },
    ts: Date.now()
  };
  context.vars.chatPayload = JSON.stringify(chatEnvelope);

  // Vote envelope
  const voteEnvelope = {
    event: 'room.variation.vote',
    watchSpaceId: DEFAULT_SPACE_ID,
    payload: {
      optionId: 'survive_yes'
    },
    ts: Date.now()
  };
  context.vars.votePayload = JSON.stringify(voteEnvelope);

  return done();
}

/**
 * Setup hook for simulated Host user context
 */
function setupHostSession(context, events, done) {
  const hostId = crypto.randomUUID();
  const token = createToken(hostId, 'host@example.com', 'HOST');

  context.vars.watchSpaceId = DEFAULT_SPACE_ID;
  context.vars.token = token;
  context.vars.isHost = true;

  const playEnvelope = {
    event: 'room.playback.update',
    watchSpaceId: DEFAULT_SPACE_ID,
    payload: {
      state: 'play',
      positionSeconds: 42.5
    },
    ts: Date.now()
  };
  context.vars.playPayload = JSON.stringify(playEnvelope);

  const pauseEnvelope = {
    event: 'room.playback.update',
    watchSpaceId: DEFAULT_SPACE_ID,
    payload: {
      state: 'pause',
      positionSeconds: 65.0
    },
    ts: Date.now()
  };
  context.vars.pausePayload = JSON.stringify(pauseEnvelope);

  return done();
}

/**
 * Process incoming WebSocket message frames to calculate fanout latency and sync drift
 */
function handleIncomingWsMessage(context, events, message, done) {
  try {
    const data = JSON.parse(message);
    const now = Date.now();

    if (data.event === 'room.sync.pong') {
      const sent = data.payload?.clientSentAt || data.ts;
      const rtt = Math.max(0, now - sent);
      const drift = Math.round(rtt / 2);

      metrics.driftSamples.push(drift);
      if (drift > metrics.maxDriftMs) metrics.maxDriftMs = drift;

      events.emit('counter', 'ws.sync.pongs_received', 1);
      events.emit('histogram', 'ws.sync.drift_ms', drift);

      // Verify drift remains < 250ms
      if (drift >= 250) {
        events.emit('counter', 'ws.sync.drift_exceeded_250ms', 1);
        console.warn(`[Artillery Warning] Sync drift exceeded 250ms threshold: ${drift}ms`);
      }
    } else if (data.event === 'room.playback.update' || data.event === 'room.chat.message') {
      const broadcastTs = data.ts || now;
      const fanoutLatency = Math.max(0, now - broadcastTs);

      metrics.fanoutSamples.push(fanoutLatency);
      if (fanoutLatency > metrics.maxFanoutMs) metrics.maxFanoutMs = fanoutLatency;

      events.emit('histogram', 'ws.fanout.latency_ms', fanoutLatency);

      if (fanoutLatency >= 250) {
        events.emit('counter', 'ws.fanout.latency_exceeded_250ms', 1);
      }
    }
  } catch (err) {
    // Non-JSON frame ignored
  }
  return done();
}

module.exports = {
  createToken,
  setupViewerSession,
  setupHostSession,
  handleIncomingWsMessage,
  metrics,
};
