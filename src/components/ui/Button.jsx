import clsx from 'clsx'

const variants = {
  default: 'btn',
  primary: 'btn btn-primary',
  danger:  'btn btn-danger',
  success: 'btn btn-success',
}

export default function Button({ variant = 'default', className, children, ...props }) {
  return (
    <button className={clsx(variants[variant], className)} {...props}>
      {children}
    </button>
  )
}