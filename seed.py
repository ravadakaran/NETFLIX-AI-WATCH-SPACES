import uuid

sql = ""
host_id = "00000000-0000-0000-0000-000000000000"

sql += f"INSERT INTO titles (id, created_at, duration_seconds, name, video_asset_url) VALUES ('22222222-2222-2222-2222-222222222222', NOW(), 3600, 'Test Movie', 'http://example.com/video.mp4') ON CONFLICT (id) DO NOTHING;\n"
sql += f"INSERT INTO users (id, created_at, display_name, email, password_hash, role) VALUES ('{host_id}', NOW(), 'Host Admin', 'host_admin@netflix-spaces.test', 'hash', 'HOST') ON CONFLICT (email) DO NOTHING;\n"
sql += f"INSERT INTO watch_spaces (id, created_at, invite_code, max_participants, status, voting_enabled, host_user_id, title_id, is_locked) VALUES ('11111111-1111-1111-1111-111111111111', NOW(), 'TESTINVITE', 1000, 'ACTIVE', true, '{host_id}', '22222222-2222-2222-2222-222222222222', false) ON CONFLICT (id) DO NOTHING;\n"

for i in range(500):
    viewer_id = f"10000000-0000-0000-0000-{str(i).zfill(12)}"
    sql += f"INSERT INTO users (id, created_at, display_name, email, password_hash, role) VALUES ('{viewer_id}', NOW(), 'Viewer {i}', 'viewer_{i}@netflix-spaces.test', 'hash', 'VIEWER') ON CONFLICT (email) DO NOTHING;\n"

with open("seed.sql", "w") as f:
    f.write(sql)
