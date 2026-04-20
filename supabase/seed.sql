-- ============================================================
-- NEXUS — Seed: Super Admin + Tim Pertama
--
-- CARA PAKAI:
-- 1. Buat user Super Admin dulu di: Supabase > Authentication > Users > Add user
--    Email: rafi@phantom.gg (atau email kamu sendiri)
--    Password: (set sendiri)
-- 2. Salin UUID user yang baru dibuat (kolom "UID")
-- 3. Ganti nilai 'GANTI_DENGAN_UUID_DARI_AUTH_USERS' di bawah dengan UUID tersebut
-- 4. Jalankan file ini di: SQL Editor > New query
-- ============================================================

-- ── 1. Buat tim pertama ──────────────────────────────────────
INSERT INTO public.teams (id, name, game, is_active)
VALUES (
  gen_random_uuid(),
  'Phantom Five',
  'Mobile Legends',
  true
)
ON CONFLICT DO NOTHING;

-- ── 2. Buat user Super Admin ──────────────────────────────────
-- Ganti UUID di bawah dengan UUID dari Supabase Auth dashboard
INSERT INTO public.users (id, name, email, role, team_id, is_active)
VALUES (
  'GANTI_DENGAN_UUID_DARI_AUTH_USERS',
  'Rafi A.',
  'rafi@phantom.gg',
  'super_admin',
  NULL,
  true
)
ON CONFLICT (id) DO UPDATE
  SET role = 'super_admin';

-- ── Setelah seed berhasil ─────────────────────────────────────
-- Kamu bisa login dengan email + password yang dibuat di langkah 1.
-- Sistem akan redirect otomatis ke /super-admin.
-- Dari sana, kamu bisa invite user lain dan assign role mereka.
