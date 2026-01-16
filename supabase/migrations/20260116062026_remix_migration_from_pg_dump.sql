CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
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

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: income_range; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.income_range AS ENUM (
    'sem_renda',
    'ate_1500',
    '1500_3000',
    'acima_3000'
);


--
-- Name: mentor_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mentor_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: professional_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.professional_status AS ENUM (
    'desempregado',
    'estudante',
    'estagiario',
    'empregado',
    'freelancer_pj'
);


--
-- Name: session_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.session_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled'
);


--
-- Name: create_initial_impact_history(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.create_initial_impact_history() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.impact_history (user_id, professional_status, income_range)
  VALUES (NEW.user_id, NEW.professional_status, NEW.income_range);
  RETURN NEW;
END;
$$;


--
-- Name: is_own_profile(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_own_profile(profile_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT auth.uid() = profile_user_id
$$;


--
-- Name: track_impact_change(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.track_impact_change() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  IF OLD.professional_status IS DISTINCT FROM NEW.professional_status 
     OR OLD.income_range IS DISTINCT FROM NEW.income_range THEN
    INSERT INTO public.impact_history (user_id, professional_status, income_range)
    VALUES (NEW.user_id, NEW.professional_status, NEW.income_range);
  END IF;
  RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: content_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    url text NOT NULL,
    item_type text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    category text DEFAULT 'geral'::text NOT NULL,
    CONSTRAINT content_items_item_type_check CHECK ((item_type = ANY (ARRAY['pdf'::text, 'video'::text])))
);


--
-- Name: impact_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.impact_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    professional_status public.professional_status NOT NULL,
    income_range public.income_range NOT NULL,
    recorded_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mentor_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentor_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mentor_id uuid NOT NULL,
    user_id uuid NOT NULL,
    scheduled_at timestamp with time zone NOT NULL,
    status public.session_status DEFAULT 'scheduled'::public.session_status NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: mentors; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mentors (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    name text NOT NULL,
    area text NOT NULL,
    description text NOT NULL,
    education text,
    photo_url text,
    availability jsonb DEFAULT '[]'::jsonb NOT NULL,
    status public.mentor_status DEFAULT 'pending'::public.mentor_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    age integer NOT NULL,
    city text NOT NULL,
    state text NOT NULL,
    professional_status public.professional_status NOT NULL,
    income_range public.income_range NOT NULL,
    lgpd_consent boolean DEFAULT false NOT NULL,
    lgpd_consent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT profiles_age_check CHECK (((age >= 18) AND (age <= 100)))
);


--
-- Name: volunteer_applications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.volunteer_applications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    area text NOT NULL,
    how_to_help text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: content_items content_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content_items
    ADD CONSTRAINT content_items_pkey PRIMARY KEY (id);


--
-- Name: impact_history impact_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impact_history
    ADD CONSTRAINT impact_history_pkey PRIMARY KEY (id);


--
-- Name: mentor_sessions mentor_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_sessions
    ADD CONSTRAINT mentor_sessions_pkey PRIMARY KEY (id);


--
-- Name: mentors mentors_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentors
    ADD CONSTRAINT mentors_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: volunteer_applications volunteer_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.volunteer_applications
    ADD CONSTRAINT volunteer_applications_pkey PRIMARY KEY (id);


--
-- Name: profiles track_profile_impact_change; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER track_profile_impact_change AFTER UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.track_impact_change();


--
-- Name: mentors update_mentors_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_mentors_updated_at BEFORE UPDATE ON public.mentors FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: impact_history impact_history_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.impact_history
    ADD CONSTRAINT impact_history_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mentor_sessions mentor_sessions_mentor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mentor_sessions
    ADD CONSTRAINT mentor_sessions_mentor_id_fkey FOREIGN KEY (mentor_id) REFERENCES public.mentors(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mentors Anyone can apply to be a mentor; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can apply to be a mentor" ON public.mentors FOR INSERT WITH CHECK (true);


--
-- Name: volunteer_applications Anyone can submit volunteer application; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can submit volunteer application" ON public.volunteer_applications FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: mentors Anyone can view approved mentors; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view approved mentors" ON public.mentors FOR SELECT USING ((status = 'approved'::public.mentor_status));


--
-- Name: content_items Authenticated users can view content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view content" ON public.content_items FOR SELECT TO authenticated USING (true);


--
-- Name: volunteer_applications Authenticated users can view volunteer applications; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view volunteer applications" ON public.volunteer_applications FOR SELECT TO authenticated USING (true);


--
-- Name: mentor_sessions Users can create sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create sessions" ON public.mentor_sessions FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: impact_history Users can insert their own impact history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own impact history" ON public.impact_history FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (((auth.uid() = user_id) AND (lgpd_consent = true)));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (public.is_own_profile(user_id)) WITH CHECK (public.is_own_profile(user_id));


--
-- Name: mentor_sessions Users can update their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own sessions" ON public.mentor_sessions FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: impact_history Users can view their own impact history; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own impact history" ON public.impact_history FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (public.is_own_profile(user_id));


--
-- Name: mentor_sessions Users can view their own sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own sessions" ON public.mentor_sessions FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: content_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

--
-- Name: impact_history; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.impact_history ENABLE ROW LEVEL SECURITY;

--
-- Name: mentor_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentor_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: mentors; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mentors ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: volunteer_applications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.volunteer_applications ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;