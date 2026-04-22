// NXK Logo component — uses the real Noctis X King Esports logo
// Place nxk-logo.png in /public/

export default function NXKLogo({ size = 48, showText = true, textSize = 'md' }) {
  const fontSizes = { sm: { name: 11, sub: 9 }, md: { name: 13, sub: 10 }, lg: { name: 18, sub: 11 } }
  const fs = fontSizes[textSize] || fontSizes.md

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size > 32 ? 12 : 8 }}>
      <img
        src="/nxk-logo.png"
        alt="Noctis X King Esports"
        style={{
          width: size,
          height: size,
          objectFit: 'contain',
          borderRadius: size > 32 ? 12 : 8,
          flexShrink: 0,
        }}
      />
      {showText && (
        <div>
          <p style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: fs.name,
            fontWeight: 800,
            letterSpacing: '0.12em',
            color: 'var(--text-primary)',
            lineHeight: 1,
            margin: 0,
          }}>
            NOCTIS X KING
          </p>
          <p style={{
            fontSize: fs.sub,
            letterSpacing: '0.16em',
            color: 'var(--text-dim)',
            lineHeight: 1,
            marginTop: 3,
            fontFamily: 'Syne, sans-serif',
          }}>
            ESPORTS
          </p>
        </div>
      )}
    </div>
  )
}

// Compact version for sidebar (icon only or minimal)
export function NXKLogoMark({ size = 30 }) {
  return (
    <img
      src="/nxk-logo.png"
      alt="NXK"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        borderRadius: 6,
        flexShrink: 0,
      }}
    />
  )
}
