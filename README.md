# NXK Esports Management System v2.1

Sistem manajemen tim esports berbasis React + Supabase untuk **Noctis X King Esports**.

---

## Setup

1. Clone / extract project
2. Copy `.env.example` → `.env` dan isi `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`
3. Jalankan SQL schema di Supabase SQL Editor:
   - **`supabase-schema.sql`** (schema utama)
   - **`supabase-schema-additions.sql`** (invite tokens + player applications)
4. `npm install && npm run dev`

---

## Fitur Baru (v2.1)

### 🔗 Sistem Invite Link Personal
| Role          | Bisa Undang             | Via              |
|---------------|-------------------------|------------------|
| Super Admin   | Team Manager + Staff    | `/super-admin/invite` |
| Team Manager  | Player                  | `/team-manager/invite` |
| Staff         | Player                  | `/team-manager/invite` |

- Setiap link **expired dalam 24 jam** dan hanya bisa dipakai **sekali**
- Link format: `https://yourdomain.com/register/:token`
- Bisa ditambahkan label/catatan untuk identifikasi

### 📋 Registrasi Player via Link
Form pendaftaran player berisi:
- Nickname / IGN
- Nama Asli
- Tempat & Tanggal Lahir
- Alamat & Domisili
- Jenis Esport

### ✅ Approval Flow
1. Player mendaftar via link → status **pending**
2. Team Manager / Super Admin mereview di halaman **Approvals**
3. Approve → akun aktif, player bisa login
4. Tolak → akun ditolak, bisa tambahkan catatan

> Staff & Team Manager yang mendaftar via invite **langsung aktif** (tidak perlu approval).

---

## Role & Akses

| Role          | Dashboard          | Keterangan                     |
|---------------|--------------------|--------------------------------|
| `super_admin` | `/super-admin`     | Akses penuh semua fitur        |
| `team_manager`| `/team-manager`    | Kelola tim, invite & approval  |
| `staff`       | `/team-manager`    | Akses team manager (read+edit) |
| `player`      | `/player`          | Lihat stats & jadwal sendiri   |

---

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Routing**: React Router v6

