const variants = {
  green: 'badge-green', red: 'badge-red', ocean: 'badge-ocean',
  navy: 'badge-navy', amber: 'badge-amber', slate: 'badge-slate',
  blue: 'badge-ocean',
}
export default function Badge({ variant = 'slate', children, style }) {
  return <span className={`badge ${variants[variant] || 'badge-slate'}`} style={style}>{children}</span>
}
