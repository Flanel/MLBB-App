// FIX BUG #8: createClient dipanggil walaupun env vars undefined.
// createClient(undefined, undefined) tidak throw langsung tapi setiap
// API call gagal dengan error yang sangat tidak jelas dan sulit didebug.
// Fix: throw error awal yang jelas sehingga developer langsung tahu masalahnya.

import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error(
    '[supabase.js] Environment variables VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY ' +
    'belum diset. Buat file .env di root project dan isi kedua variabel tersebut.',
  )
}

export const supabase = createClient(url, key)
