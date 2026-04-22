export default function Button({ variant = 'default', className, children, ...props }) {
  const cls = {
    default: 'btn',
    primary: 'btn btn-primary',
    danger:  'btn btn-danger',
    success: 'btn btn-success',
  }[variant] || 'btn'
  return <button className={`${cls}${className ? ' ' + className : ''}`} {...props}>{children}</button>
}
