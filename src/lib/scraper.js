const PLATFORMS = {
  challonge:   /challonge\.com/,
  startgg:     /start\.gg|smash\.gg/,
  toornament:  /toornament\.com/,
  battlefy:    /battlefy\.com/,
}

export function detectPlatform(url) {
  for (const [name, pattern] of Object.entries(PLATFORMS)) {
    if (pattern.test(url)) return name
  }
  return 'generic'
}

function normalize(raw, platform, sourceUrl) {
  return {
    name:         raw.name || raw.full_name || 'Unknown Tournament',
    platform,
    sourceUrl,
    startDate:    raw.started_at || raw.start_at || raw.startAt || null,
    endDate:      raw.completed_at || raw.end_at || raw.endAt || null,
    format:       raw.tournament_type || raw.type || 'unknown',
    totalTeams:   raw.participants_count || raw.numAttendees || 0,
    ourPlacement: null,
    prizePool:    raw.prize || null,
    matches:      [],
    lastSyncedAt: new Date().toISOString(),
  }
}

async function fetchChallonge(url) {
  const match = url.match(/challonge\.com\/([^/?#\s]+)/)
  if (!match) throw new Error('Could not parse Challonge slug from URL')
  const slug = match[1]
  const res = await fetch(
    `https://api.challonge.com/v1/tournaments/${slug}.json?include_participants=1&include_matches=1`
  )
  if (!res.ok) throw new Error(`Challonge API error: ${res.status}`)
  const { tournament } = await res.json()
  return normalize(tournament, 'challonge', url)
}

async function fetchStartgg(url) {
  const match = url.match(/start\.gg\/tournament\/([^/?#\s]+)/)
  if (!match) throw new Error('Could not parse start.gg slug from URL')
  const slug = match[1]
  const query = `{ tournament(slug: "${slug}") { name startAt endAt numAttendees } }`
  const res = await fetch('https://api.start.gg/gql/alpha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error(`start.gg API error: ${res.status}`)
  const { data } = await res.json()
  return normalize(data.tournament, 'startgg', url)
}

// DEBUG: generic platforms go through Supabase Edge Function to avoid CORS
async function fetchGeneric(url) {
  const { supabase } = await import('./supabase')
  const { data, error } = await supabase.functions.invoke('scrape-tournament', {
    body: { url },
  })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchTournament(url) {
  const platform = detectPlatform(url)
  const handlers = {
    challonge:  fetchChallonge,
    startgg:    fetchStartgg,
    toornament: fetchGeneric,
    battlefy:   fetchGeneric,
    generic:    fetchGeneric,
  }
  return handlers[platform](url)
}
