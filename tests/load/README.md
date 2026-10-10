# Netflix AI Watch Spaces - Load & Stress Testing Suite

Comprehensive load, stress, and latency testing suite simulating up to **500 concurrent WebSocket clients** in a single Watch Space room performing:
- Synchronous playback transitions (Play / Pause / Seek)
- Real-time chat messages
- Narrative branch predictions & variation voting
- Continuous clock drift telemetry (ping/pong)

## SLAs & Verification Targets
- **Clock Sync Drift**: $< 250\text{ms}$ ($p95 < 250\text{ms}$, $p99 < 250\text{ms}$)
- **Fan-Out Delivery Latency**: $< 250\text{ms}$ under 500 concurrent room members
- **Room isolation**: narrative actions in one room must not serialize actions in another room
- **Submission integrity**: one accepted prediction answer per `(round, user)` under concurrent retries

The backend enforces room isolation with a PostgreSQL pessimistic lock on the
target watch-space row. Run the WebSocket scenario together with repeated
`POST /api/v1/watch-spaces/{id}/narrative/actions` calls against at least two
room IDs to validate fan-out latency and cross-room independence.

---

## 1. Standalone Stress Test Runner (Zero external dependencies)
Uses Node.js native WebSocket client to simulate 500 concurrent connections, calculate latency percentiles, and generate JSON reports.

```bash
# Run 500 concurrent clients for 30 seconds
$env:JWT_SECRET = '<same test secret used by the backend>'
node tests/load/run-stress-test.mjs --concurrency=500 --duration=30

# Custom host or space ID
node tests/load/run-stress-test.mjs --concurrency=500 --host=localhost:8081 --spaceId=NX-DEMO
```

The runner is live-only: it exits non-zero when the host or requested viewer
count cannot connect, and never substitutes simulated latency measurements.

---

## 2. Artillery Load Testing
Run Artillery against the WebSocket cluster:

```bash
# Run the Artillery scenario
npx artillery run tests/load/artillery-ws-stress.yml

# Or generate an HTML report
npx artillery run --output tests/load/artillery-report.json tests/load/artillery-ws-stress.yml
npx artillery report tests/load/artillery-report.json
```

---

## 3. Python Locust Load Testing
Simulates scalable swarm of viewers and hosts:

```bash
pip install locust websocket-client

# Run headless with 500 users, spawn rate 25/s for 1 minute:
locust -f tests/load/locustfile.py --headless -u 500 -r 25 --run-time 1m --host localhost:8081

# Or run with the web UI:
locust -f tests/load/locustfile.py --host localhost:8081
```
