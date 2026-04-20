-- ============================================================
-- NEXUS — Supabase Schema
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- ── TABLES ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.teams (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  game       text NOT NULL DEFAULT 'Mobile Legends',
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
  id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL,
  email      text NOT NULL,
  role       text NOT NULL CHECK (role IN ('super_admin','team_manager','staff','player')),
  team_id    uuid REFERENCES public.teams(id),
  ign        text,
  lane       text,
  is_active  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tournaments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES public.teams(id),
  name        text NOT NULL,
  platform    text NOT NULL DEFAULT 'Other',
  format      text,
  date_label  text,
  placement   text,
  status      text NOT NULL DEFAULT 'Ongoing' CHECK (status IN ('Ongoing','Completed')),
  source_url  text,
  total_teams integer,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.matches (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES public.teams(id),
  tournament_id uuid REFERENCES public.tournaments(id),
  tournament    text,
  date          date NOT NULL DEFAULT CURRENT_DATE,
  opponent      text NOT NULL,
  result        text NOT NULL CHECK (result IN ('Win','Loss')),
  score         text,
  round         text,
  created_by    uuid REFERENCES public.users(id),
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.match_player_stats (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id   uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id  uuid NOT NULL REFERENCES public.users(id),
  hero       text,
  kills      integer NOT NULL DEFAULT 0,
  deaths     integer NOT NULL DEFAULT 0,
  assists    integer NOT NULL DEFAULT 0,
  damage     bigint NOT NULL DEFAULT 0,
  mvp        boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.player_activities (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES public.users(id),
  activity_type    text NOT NULL,
  duration_minutes integer NOT NULL,
  notes            text,
  logged_at        timestamptz NOT NULL DEFAULT now(),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES public.users(id),
  role       text,
  action     text NOT NULL,
  target     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── ENABLE RLS ──────────────────────────────────────────────

ALTER TABLE public.teams             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournaments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs        ENABLE ROW LEVEL SECURITY;

-- ── HELPER FUNCTIONS ─────────────────────────────────────────

-- Returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- Returns the team_id of the currently authenticated user
CREATE OR REPLACE FUNCTION public.current_team_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT team_id FROM public.users WHERE id = auth.uid()
$$;

-- Returns true if the current user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role = 'super_admin' FROM public.users WHERE id = auth.uid()
$$;

-- ── RLS POLICIES: teams ──────────────────────────────────────

-- Super admin can do everything
CREATE POLICY "super_admin_all_teams" ON public.teams
  FOR ALL USING (public.is_super_admin());

-- Team members can view their own team (only if active)
CREATE POLICY "members_view_own_team" ON public.teams
  FOR SELECT USING (
    id = public.current_team_id()
    AND is_active = true
  );

-- ── RLS POLICIES: users ──────────────────────────────────────

-- Super admin can read all users
CREATE POLICY "super_admin_all_users" ON public.users
  FOR ALL USING (public.is_super_admin());

-- Any authenticated user can read members of their own team
CREATE POLICY "members_view_team_users" ON public.users
  FOR SELECT USING (team_id = public.current_team_id());

-- Users can update their own row (name, ign, lane only — not role)
CREATE POLICY "user_update_own" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- ── RLS POLICIES: tournaments ────────────────────────────────

CREATE POLICY "super_admin_all_tournaments" ON public.tournaments
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "team_view_own_tournaments" ON public.tournaments
  FOR SELECT USING (team_id = public.current_team_id());

CREATE POLICY "manager_staff_insert_tournaments" ON public.tournaments
  FOR INSERT WITH CHECK (
    team_id = public.current_team_id()
    AND public.current_role() IN ('team_manager','staff')
  );

CREATE POLICY "manager_staff_update_tournaments" ON public.tournaments
  FOR UPDATE USING (
    team_id = public.current_team_id()
    AND public.current_role() IN ('team_manager','staff')
  );

-- ── RLS POLICIES: matches ─────────────────────────────────────

CREATE POLICY "super_admin_all_matches" ON public.matches
  FOR ALL USING (public.is_super_admin());

CREATE POLICY "team_view_own_matches" ON public.matches
  FOR SELECT USING (team_id = public.current_team_id());

CREATE POLICY "manager_staff_insert_matches" ON public.matches
  FOR INSERT WITH CHECK (
    team_id = public.current_team_id()
    AND public.current_role() IN ('team_manager','staff')
  );

-- ── RLS POLICIES: match_player_stats ─────────────────────────

CREATE POLICY "super_admin_all_stats" ON public.match_player_stats
  FOR ALL USING (public.is_super_admin());

-- Any team member can view stats for their team's matches
CREATE POLICY "team_view_match_stats" ON public.match_player_stats
  FOR SELECT USING (
    match_id IN (
      SELECT id FROM public.matches WHERE team_id = public.current_team_id()
    )
  );

CREATE POLICY "manager_staff_insert_stats" ON public.match_player_stats
  FOR INSERT WITH CHECK (
    public.current_role() IN ('team_manager','staff')
    AND match_id IN (
      SELECT id FROM public.matches WHERE team_id = public.current_team_id()
    )
  );

-- ── RLS POLICIES: player_activities ──────────────────────────

CREATE POLICY "super_admin_all_activities" ON public.player_activities
  FOR ALL USING (public.is_super_admin());

-- Manager/staff can view all activities in their team
CREATE POLICY "manager_view_team_activities" ON public.player_activities
  FOR SELECT USING (
    public.current_role() IN ('team_manager','staff')
    AND user_id IN (
      SELECT id FROM public.users WHERE team_id = public.current_team_id()
    )
  );

-- Players can only view and insert their own activities
CREATE POLICY "player_own_activities" ON public.player_activities
  FOR ALL USING (user_id = auth.uid());

-- ── RLS POLICIES: audit_logs ─────────────────────────────────

-- Only super admin can read audit logs
CREATE POLICY "super_admin_all_audit" ON public.audit_logs
  FOR ALL USING (public.is_super_admin());

-- Any authenticated user can insert (for logging their own actions)
CREATE POLICY "authenticated_insert_audit" ON public.audit_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
