CREATE TABLE IF NOT EXISTS scheduled_spaces (
    id UUID PRIMARY KEY,
    host_user_id UUID NOT NULL,
    title_id UUID NOT NULL,
    scheduled_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    watch_space_id UUID,
    CONSTRAINT fk_scheduled_space_host FOREIGN KEY (host_user_id) REFERENCES users(id),
    CONSTRAINT fk_scheduled_space_title FOREIGN KEY (title_id) REFERENCES titles(id)
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS presence_status VARCHAR(255);

CREATE TABLE IF NOT EXISTS user_friends (
    user_id UUID NOT NULL,
    friend_id UUID NOT NULL,
    PRIMARY KEY (user_id, friend_id),
    CONSTRAINT fk_user_friend_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_user_friend_friend FOREIGN KEY (friend_id) REFERENCES users(id)
);
