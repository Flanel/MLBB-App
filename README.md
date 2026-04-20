# Nexus — Esports Team Management

Vite + React + Supabase + Tailwind CSS. Deploy ke Vercel gratis.

---

## Setup (ikuti urutan ini)

### 1. Buat project Supabase
Buka supabase.com > New project. Catat Project URL dan anon key dari Settings > API.

### 2. Jalankan schema
Buka Supabase > SQL Editor > New query, paste isi file `supabase/schema.sql`, lalu Run.

### 3. Buat akun Super Admin
Di Supabase > Authentication > Users > Add user:
- Email: email kamu
- Password: set sendiri
- Salin UUID yang muncul di kolom UID

Buka `supabase/seed.sql`, ganti `GANTI_DENGAN_UUID_DARI_AUTH_USERS` dengan UUID tadi.
Jalankan file seed di SQL Editor.

### 4. Isi .env
Buka file `.env` lalu isi:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 5. Install dan run
```bash
npm install
npm run dev
```
Buka http://localhost:5173, login dengan email + password dari langkah 3.

---

## Deploy ke Vercel

1. Push ke GitHub
2. Import repo di vercel.com
3. Tambahkan env vars di Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy — `vercel.json` sudah handle SPA routing otomatis

**Catatan:** File `.env` tidak ikut ke GitHub (ada di .gitignore). Env vars di Vercel diisi manual.

---

## Menambah user baru

Setelah login sebagai Super Admin:
1. Buat user di Supabase > Authentication > Users > Add user
2. Salin UUID mereka
3. Insert ke tabel `users` via SQL Editor:

```sql
INSERT INTO public.users (id, name, email, role, team_id)
VALUES (
  'UUID_USER_BARU',
  'Nama Player',
  'email@domain.com',
  'player',  -- atau: team_manager, staff
  (SELECT id FROM public.teams WHERE name = 'Phantom Five')
);
```

---

## Struktur project

```
src/
├── App.jsx                    # Router utama + role redirect
├── lib/supabase.js            # Supabase client
├── lib/scraper.js             # Tournament URL detection
├── hooks/useAuth.js           # Auth state + role
├── hooks/useToast.js          # Toast state
├── router/ProtectedRoute.jsx  # Auth guard
├── components/layout/         # Sidebar, Topbar, DashboardLayout
├── components/ui/             # Modal, Button, Badge, KpiCard, Toast
├── components/super-admin/    # DeactivateModal
└── pages/
    ├── auth/LoginPage.jsx
    └── dashboard/
        ├── super-admin/       # Overview, Teams, Users, Audit, Settings
        ├── team-manager/      # Dashboard, Roster, Matches, Tournaments, Analytics
        └── player/            # Dashboard, History, Tournaments, Activity
supabase/
├── schema.sql                 # DDL + RLS policies
└── seed.sql                   # Super Admin seed
```
