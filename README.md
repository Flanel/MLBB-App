# NXK Esports — Management System

Team management web app untuk tim MLBB. Dibangun dengan React + Supabase.

## Stack
- **Frontend**: React 18, Vite, Tailwind CSS v3
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Hosting**: Vercel (gratis)

## Color Palette
Navy · Black · Blue Ocean · White

## Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Environment
```bash
cp .env.example .env.local
# Isi VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY
```

### 3. Database
Jalankan `supabase-schema.sql` di Supabase SQL Editor.

### 4. Buat akun Super Admin
Di Supabase Dashboard → Authentication → Users → Add user
Lalu update tabel `users` set `role = 'super_admin'` untuk user tersebut.

### 5. Run
```bash
npm run dev
```

## Roles
| Role | Akses |
|---|---|
| `super_admin` | Full control, manage semua tim |
| `team_manager` | Manage tim sendiri |
| `staff` | Bantu manager |
| `player` | Lihat & input data sendiri |

## Fitur
- ✅ Auth unified (1 login page, 4 roles)
- ✅ Team deactivation (blokir login semua anggota)
- ✅ Match input + player stats (K/D/A, Hero, MVP, Damage)
- ✅ Analytics + Win Rate trend chart
- ✅ **Party Win Rate** — Solo / Duo / Trio / Squad / Full Party
- ✅ **Schedule** — Jadwal latihan, scrim, tournament
- ✅ **Player Availability** — Konfirmasi hadir/tidak per sesi
- ✅ Activity log per player
- ✅ Audit log (Super Admin)
- ✅ Responsive (mobile + desktop)
- ✅ Row Level Security (Supabase RLS)
