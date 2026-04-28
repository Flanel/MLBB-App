// sanitize.js — Input sanitization utility
// Mencegah XSS, SQL injection patterns, dan karakter berbahaya

// Karakter/pattern yang diblokir
const DANGEROUS_PATTERNS = [
  /(<script[\s\S]*?>[\s\S]*?<\/script>)/gi,   // script tags
  /(javascript\s*:)/gi,                          // javascript: protocol
  /(\bon\w+\s*=)/gi,                             // event handlers (onclick=, etc)
  /(DROP\s+TABLE|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|ALTER\s+TABLE|CREATE\s+TABLE|TRUNCATE\s+TABLE)/gi, // SQL DDL/DML
  /(-{2}|\/\*[\s\S]*?\*\/)/g,                   // SQL comments
  /(UNION\s+(ALL\s+)?SELECT)/gi,                 // SQL UNION
  /(\bEXEC\b|\bEXECUTE\b|\bxp_)/gi,             // SQL exec
  /(0x[0-9a-fA-F]+)/g,                           // hex injection
]

// Sanitize string: trim + strip dangerous patterns
export function sanitizeStr(value) {
  if (typeof value !== 'string') return ''
  let v = value.trim()
  for (const pattern of DANGEROUS_PATTERNS) {
    v = v.replace(pattern, '')
  }
  // Escape HTML entities
  v = v
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
  return v.trim()
}

// Sanitize khusus nama: hanya huruf, spasi, tanda baca umum
export function sanitizeName(value) {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/[^a-zA-Z0-9\s\u00C0-\u017E\u0100-\u024F.,'\-]/g, '')
    .replace(/\s{2,}/g, ' ')
    .substring(0, 100)
}

// Sanitize IGN: alfanumerik + simbol game umum
export function sanitizeIGN(value) {
  if (typeof value !== 'string') return ''
  return value
    .trim()
    .replace(/[^a-zA-Z0-9_\-. ]/g, '')
    .substring(0, 30)
}

// Sanitize email: basic
export function sanitizeEmail(value) {
  if (typeof value !== 'string') return ''
  return value.trim().toLowerCase().substring(0, 100)
}

// Sanitize textarea / notes
export function sanitizeText(value, maxLen = 500) {
  if (typeof value !== 'string') return ''
  let v = value.trim()
  for (const pattern of DANGEROUS_PATTERNS) {
    v = v.replace(pattern, '')
  }
  return v.substring(0, maxLen)
}

// Validasi token format (UUID v4 only)
export function isValidToken(token) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
}

// Validasi email format
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 100
}

// Honeypot check: returns true if bot (field should be empty)
export function isBot(honeypotValue) {
  return honeypotValue !== ''
}
