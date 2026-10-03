"""
Locust load test for Netflix AI Watch Spaces WebSocket server.
Simulates up to 500 concurrent WebSocket clients in a single room performing:
 - Synchronized playback (Play / Pause / Seek)
 - Real-time chat messages
 - Narrative branching and variation voting
 - Periodic clock synchronization (Sync Ping / Pong)
Measures:
 - Fan-out broadcast latency
 - Clock synchronization drift (verifying drift remains < 250ms)
"""

import hmac
import hashlib
import base64
import json
import time
import uuid
import threading
import os
from locust import User, task, between, events

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970")
WATCH_SPACE_ID = os.getenv("WATCH_SPACE_ID", "11111111-1111-1111-1111-111111111111")
WS_HOST = os.getenv("WS_HOST", "localhost:8081")

def base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def generate_jwt_token(user_id: str, email: str, role: str = "VIEWER") -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "iat": int(time.time()),
        "exp": int(time.time()) + 86400
    }
    encoded_header = base64url_encode(json.dumps(header).encode('utf-8'))
    encoded_payload = base64url_encode(json.dumps(payload).encode('utf-8'))
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    
    # Secret key handling (hex string or raw bytes)
    try:
        if len(JWT_SECRET) == 64:
            secret_bytes = bytes.fromhex(JWT_SECRET)
        else:
            secret_bytes = JWT_SECRET.encode('utf-8')
    except Exception:
        secret_bytes = JWT_SECRET.encode('utf-8')
        
    signature = hmac.new(secret_bytes, signing_input, hashlib.sha256).digest()
    encoded_signature = base64url_encode(signature)
    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"

try:
    import websocket
except ImportError:
    websocket = None


class WatchSpaceViewerUser(User):
    wait_time = between(1, 4)
    weight = 49

    def on_start(self):
        self.user_id = str(uuid.uuid4())
        self.email = f"locust_viewer_{self.user_id[:8]}@example.com"
        self.token = generate_jwt_token(self.user_id, self.email, "VIEWER")
        self.ws = None
        self.connected = False
        self.running = True
        self.connect_ws()

    def connect_ws(self):
        if websocket is None:
            return
        ws_url = f"ws://{WS_HOST}/ws/watch-spaces/{WATCH_SPACE_ID}?token={self.token}"
        try:
            self.ws = websocket.create_connection(ws_url, timeout=5)
            self.connected = True
            self.listener_thread = threading.Thread(target=self._listen_loop, daemon=True)
            self.listener_thread.start()
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="Connect_Viewer",
                response_time=0,
                response_length=0,
                exception=e
            )

    def _listen_loop(self):
        while self.running and self.ws:
            try:
                raw_msg = self.ws.recv()
                if not raw_msg:
                    break
                now = time.time() * 1000
                data = json.loads(raw_msg)
                event = data.get("event")

                if event == "room.sync.pong":
                    sent = data.get("payload", {}).get("clientSentAt", now)
                    rtt = max(0, now - sent)
                    drift = round(rtt / 2)
                    # Verify sync drift remains < 250ms
                    is_success = drift < 250
                    exc = None if is_success else Exception(f"Sync drift exceeded 250ms: {drift}ms")
                    events.request.fire(
                        request_type="WebSocket",
                        name="Sync_Drift_ms",
                        response_time=drift,
                        response_length=len(raw_msg),
                        exception=exc
                    )

                elif event in ("room.playback.update", "room.chat.message"):
                    ts = data.get("ts", now)
                    fanout_latency = max(0, now - ts)
                    is_success = fanout_latency < 250
                    exc = None if is_success else Exception(f"Fan-out latency exceeded 250ms: {fanout_latency}ms")
                    events.request.fire(
                        request_type="WebSocket",
                        name=f"FanOut_{event}",
                        response_time=fanout_latency,
                        response_length=len(raw_msg),
                        exception=exc
                    )
            except Exception:
                break

    @task(4)
    def ping_sync(self):
        if not self.connected or not self.ws:
            return
        payload = {
            "event": "room.sync.ping",
            "watchSpaceId": WATCH_SPACE_ID,
            "payload": {
                "clientSentAt": int(time.time() * 1000)
            },
            "ts": int(time.time() * 1000)
        }
        try:
            self.ws.send(json.dumps(payload))
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="Send_SyncPing",
                response_time=0,
                response_length=0,
                exception=e
            )

    @task(2)
    def send_chat(self):
        if not self.connected or not self.ws:
            return
        payload = {
            "event": "room.chat.message",
            "watchSpaceId": WATCH_SPACE_ID,
            "payload": {
                "body": f"Sync is running smoothly! Viewer: {self.user_id[:6]}",
                "tsSeconds": 30.0
            },
            "ts": int(time.time() * 1000)
        }
        try:
            self.ws.send(json.dumps(payload))
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="Send_ChatMessage",
                response_time=0,
                response_length=0,
                exception=e
            )

    @task(1)
    def cast_vote(self):
        if not self.connected or not self.ws:
            return
        payload = {
            "event": "room.variation.vote",
            "watchSpaceId": WATCH_SPACE_ID,
            "payload": {
                "optionId": "survive_yes"
            },
            "ts": int(time.time() * 1000)
        }
        try:
            self.ws.send(json.dumps(payload))
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="Send_VariationVote",
                response_time=0,
                response_length=0,
                exception=e
            )

    def on_stop(self):
        self.running = False
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass


class WatchSpaceHostUser(User):
    wait_time = between(3, 8)
    weight = 1

    def on_start(self):
        self.user_id = str(uuid.uuid4())
        self.email = "host_orchestrator@example.com"
        self.token = generate_jwt_token(self.user_id, self.email, "HOST")
        self.ws = None
        self.connected = False
        self.is_playing = False
        self.connect_ws()

    def connect_ws(self):
        if websocket is None:
            return
        ws_url = f"ws://{WS_HOST}/ws/watch-spaces/{WATCH_SPACE_ID}?token={self.token}"
        try:
            self.ws = websocket.create_connection(ws_url, timeout=5)
            self.connected = True
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="Connect_Host",
                response_time=0,
                response_length=0,
                exception=e
            )

    @task
    def toggle_playback(self):
        if not self.connected or not self.ws:
            return
        self.is_playing = not self.is_playing
        state = "play" if self.is_playing else "pause"
        payload = {
            "event": "room.playback.update",
            "watchSpaceId": WATCH_SPACE_ID,
            "payload": {
                "state": state,
                "positionSeconds": 45.0
            },
            "ts": int(time.time() * 1000)
        }
        try:
            start = time.time()
            self.ws.send(json.dumps(payload))
            dur = (time.time() - start) * 1000
            events.request.fire(
                request_type="WebSocket",
                name="Host_PlaybackUpdate",
                response_time=dur,
                response_length=len(json.dumps(payload)),
                exception=None
            )
        except Exception as e:
            events.request.fire(
                request_type="WebSocket",
                name="Host_PlaybackUpdate",
                response_time=0,
                response_length=0,
                exception=e
            )

    def on_stop(self):
        if self.ws:
            try:
                self.ws.close()
            except Exception:
                pass
