--
-- PostgreSQL database dump
--


-- Dumped from database version 18.6 (6569466)
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp without time zone NOT NULL,
    msg_type character varying(255) NOT NULL,
    ts_seconds double precision,
    user_id uuid,
    watch_space_id uuid NOT NULL
);


--
-- Name: interactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.interactions (
    id uuid NOT NULL,
    completed boolean NOT NULL,
    created_at timestamp without time zone NOT NULL,
    rating smallint,
    watched_seconds integer NOT NULL,
    title_id uuid NOT NULL,
    user_id uuid NOT NULL
);


--
-- Name: timeline_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.timeline_events (
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    event_type character varying(255) NOT NULL,
    payload text NOT NULL,
    ts_seconds integer NOT NULL,
    title_id uuid NOT NULL
);


--
-- Name: titles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.titles (
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    description text,
    duration_seconds integer NOT NULL,
    genre character varying(255),
    name character varying(255) NOT NULL,
    thumbnail_url character varying(255),
    video_asset_url character varying(255) NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    created_at timestamp without time zone NOT NULL,
    display_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(255) NOT NULL,
    subtitle_locale character varying(255)
);


--
-- Name: variation_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.variation_options (
    id uuid NOT NULL,
    asset_ref character varying(255),
    label character varying(255) NOT NULL,
    vote_count integer NOT NULL,
    timeline_event_id uuid NOT NULL
);


--
-- Name: watch_space_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.watch_space_participants (
    user_id uuid NOT NULL,
    watch_space_id uuid NOT NULL,
    joined_at timestamp without time zone NOT NULL,
    left_at timestamp without time zone
);


--
-- Name: watch_spaces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.watch_spaces (
    id uuid NOT NULL,
    ai_verbosity character varying(255),
    created_at timestamp without time zone NOT NULL,
    ended_at timestamp without time zone,
    invite_code character varying(255) NOT NULL,
    max_participants integer NOT NULL,
    playback_state character varying(255),
    position_seconds double precision,
    status character varying(255) NOT NULL,
    voting_enabled boolean NOT NULL,
    host_user_id uuid NOT NULL,
    title_id uuid NOT NULL
);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: interactions interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT interactions_pkey PRIMARY KEY (id);


--
-- Name: timeline_events timeline_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT timeline_events_pkey PRIMARY KEY (id);


--
-- Name: titles titles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.titles
    ADD CONSTRAINT titles_pkey PRIMARY KEY (id);


--
-- Name: users uk_6dotkott2kjsp8vw4d0m25fb7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT uk_6dotkott2kjsp8vw4d0m25fb7 UNIQUE (email);


--
-- Name: watch_spaces uk_f8p0xesvl9wsi09tiaymiw8pi; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_spaces
    ADD CONSTRAINT uk_f8p0xesvl9wsi09tiaymiw8pi UNIQUE (invite_code);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: variation_options variation_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variation_options
    ADD CONSTRAINT variation_options_pkey PRIMARY KEY (id);


--
-- Name: watch_space_participants watch_space_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_space_participants
    ADD CONSTRAINT watch_space_participants_pkey PRIMARY KEY (user_id, watch_space_id);


--
-- Name: watch_spaces watch_spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_spaces
    ADD CONSTRAINT watch_spaces_pkey PRIMARY KEY (id);


--
-- Name: idx_chat_messages_space_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_space_created ON public.chat_messages USING btree (watch_space_id, created_at);


--
-- Name: idx_interactions_user_title; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_interactions_user_title ON public.interactions USING btree (user_id, title_id);


--
-- Name: idx_participants_space; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_participants_space ON public.watch_space_participants USING btree (watch_space_id);


--
-- Name: idx_timeline_events_title_ts; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timeline_events_title_ts ON public.timeline_events USING btree (title_id, ts_seconds);


--
-- Name: idx_watch_spaces_invite_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watch_spaces_invite_code ON public.watch_spaces USING btree (invite_code);


--
-- Name: idx_watch_spaces_title_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_watch_spaces_title_status ON public.watch_spaces USING btree (title_id, status);


--
-- Name: interactions fk3en1u622jlvp97u4p5q93qyom; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT fk3en1u622jlvp97u4p5q93qyom FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: chat_messages fk44hqxd8y8truye4moh3f5ye8p; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk44hqxd8y8truye4moh3f5ye8p FOREIGN KEY (watch_space_id) REFERENCES public.watch_spaces(id);


--
-- Name: chat_messages fk6f0y4l43ihmgfswkgy9yrtjkh; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT fk6f0y4l43ihmgfswkgy9yrtjkh FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: watch_spaces fkaoai68j2vswtc0qwkmvc6p7rg; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_spaces
    ADD CONSTRAINT fkaoai68j2vswtc0qwkmvc6p7rg FOREIGN KEY (title_id) REFERENCES public.titles(id);


--
-- Name: variation_options fkf06l87ntfxb2bxedf7gk3y9l1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.variation_options
    ADD CONSTRAINT fkf06l87ntfxb2bxedf7gk3y9l1 FOREIGN KEY (timeline_event_id) REFERENCES public.timeline_events(id);


--
-- Name: watch_space_participants fkfuccvuoa0yb2v9dh6trek5qyn; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_space_participants
    ADD CONSTRAINT fkfuccvuoa0yb2v9dh6trek5qyn FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: watch_space_participants fkkrlokr8vui58as1999p3jhogv; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_space_participants
    ADD CONSTRAINT fkkrlokr8vui58as1999p3jhogv FOREIGN KEY (watch_space_id) REFERENCES public.watch_spaces(id);


--
-- Name: watch_spaces fkn3io37dd0ol36b6c9jd6r0uw3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.watch_spaces
    ADD CONSTRAINT fkn3io37dd0ol36b6c9jd6r0uw3 FOREIGN KEY (host_user_id) REFERENCES public.users(id);


--
-- Name: timeline_events fko6rj65nk4kgh83clqwxtjnc4v; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.timeline_events
    ADD CONSTRAINT fko6rj65nk4kgh83clqwxtjnc4v FOREIGN KEY (title_id) REFERENCES public.titles(id);


--
-- Name: interactions fksgeoa8l0jg1p7wwv5rnpkabqw; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.interactions
    ADD CONSTRAINT fksgeoa8l0jg1p7wwv5rnpkabqw FOREIGN KEY (title_id) REFERENCES public.titles(id);


--
-- PostgreSQL database dump complete
--

\unrestrict HJKcV11IPWIvJHRE8GoTtnQc0qu8dTQKAbbhT88xwhuSQbwY0FpcxHqnMe8CLvw

