// FIX BUG #4: fetchChallonge dan fetchStartgg sebelumnya memanggil API
// langsung dari browser:
//   - Challonge: butuh ?api_key= dan tidak izinkan CORS dari browser → gagal
//   - start.gg: butuh Authorization: Bearer TOKEN → 401 Unauthorized
//
// Fix: routing SEMUA external API call melalui Supabase Edge Function
// (sama seperti fetchGeneric yang sebelumnya sudah benar).
// Taruh CHALLONGE_API_KEY dan STARTGG_TOKEN sebagai secret di Supabase dashboard,
// lalu baca dari Deno.env di dalam Edge Function 'scrape-tournament'.

import { supabase } from './supabase'

const PLATFORMS = {
  challonge:  /challonge\.com/,
  startgg:    /start\.gg|smash\.gg/,
  toornament: /toornament\.com/,
  battlefy:   /battlefy\.com/,
}

export function detectPlatform(url) {
  for (const [name, pattern] of Object.entries(PLATFORMS)) {
    if (pattern.test(url)) return name
  }
  return 'generic'
}

// DEBUG: semua platform dikirim ke Edge Function agar API key tidak expose di client
async function invokeEdgeFunction(url, platform) {
  const { data, error } = await supabase.functions.invoke('scrape-tournament', {
    body: { url, platform },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchTournament(url) {
  const platform = detectPlatform(url)
  return invokeEdgeFunction(url, platform)
}
