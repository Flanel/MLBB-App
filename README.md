# Nexus — Esports Team Management

Vite + React + Supabase + Tailwind CSS. Deploy ke Vercel gratis.

---

## Setup lokal

```bash
# 1. Install dependencies
npm install

# 2. Isi environment variables
# Buka file .env lalu isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
# Ambil dari: supabase.com > project kamu > Settings > API

# 3. Jalankan dev server
npm run dev
```

Buka http://localhost:5173

---

## Deploy ke Vercel

1. Push project ke GitHub
2. Buka vercel.com > New Project > import repo
3. Tambahkan environment variables di Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

File `vercel.json` sudah dikonfigurasi untuk SPA routing — tidak perlu setting tambahan.

---

## Environment variables

Edit file `.env` (sudah tersedia, tinggal isi):

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Ambil dari Supabase dashboard: Settings > API > Project URL + anon key.

File `.env` sudah ada di `.gitignore` — tidak akan ikut ke GitHub.
Untuk Vercel, tambahkan manual di project settings.

---

## Struktur project

```
src/
├── App.jsx                        # Router utama
├── main.jsx
├── index.css                      # Tailwind + custom classes
├── lib/
│   ├── supabase.js                # Supabase client
│   └── scraper.js                 # Tournament scraping utility
├── hooks/
│   ├── useAuth.js                 # Auth state + role
│   ├── useRole.js                 # Role permission helpers
│   └── useToast.js                # Toast notification state
├── router/
│   └── ProtectedRoute.jsx         # Auth guard
├── components/
│   ├── layout/                    # Sidebar, Topbar, DashboardLayout
│   ├── ui/                        # Modal, Button, Badge, KpiCard, DataTable, Toast
│   └── super-admin/               # DeactivateModal
└── pages/
    ├── auth/LoginPage.jsx
    └── dashboard/
        ├── super-admin/           # Overview, Teams, Users, Audit, Settings
        ├── team-manager/          # Dashboard, Roster, Matches, Tournaments, Analytics
        └── player/                # Dashboard, History, Tournaments, Activity
```

---

## Roles

| Role | Route awal | Keterangan |
|---|---|---|
| `super_admin` | `/super-admin` | Full control, deactivate tim, audit log |
| `team_manager` | `/team-manager` | Kelola tim sendiri |
| `staff` | `/team-manager` | Bantu team manager |
| `player` | `/player` | Lihat stats, log aktivitas |

Semua role login di halaman yang sama: `/login`

---

## Database

Jalankan SQL dari `supabase/schema.sql` di Supabase SQL editor untuk membuat tabel.
Jalankan `supabase/seed.sql` untuk membuat akun Super Admin pertama.

(File schema dan seed menyusul di sprint database.)
