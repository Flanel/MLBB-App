import clsx from 'clsx'

const variants = {
  green: 'badge-green',
  red:   'badge-red',
  blue:  'badge-blue',
  amber: 'badge-amber',
  slate: 'badge-slate',
}

export default function Badge({ variant = 'slate', className, children }) {
  return (
    <span className={clsx('badge', variants[variant], className)}>
      {children}
    </span>
  )
}