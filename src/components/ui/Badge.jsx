const variants = {
  green: 'badge-green', red: 'badge-red', ocean: 'badge-blue',
  navy: 'badge-blue', amber: 'badge-amber', slate: 'badge-slate',
  blue: 'badge-blue', cyan: 'badge-cyan', purple: 'badge-purple',
}
export default function Badge({ variant = 'slate', children, style }) {
  return (
    <span className={`badge ${variants[variant] || 'badge-slate'}`} style={style}>
      {children}
    </span>
  )
}
