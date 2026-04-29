export default function Button({ children, onClick, variant='default', disabled, type='button', style={} }) {
  const variants = {
    default: 'btn',
    primary: 'btn btn-primary',
    danger:  'btn btn-danger',
    success: 'btn btn-success',
    cyan:    'btn btn-cyan',
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={variants[variant] || 'btn'}
      style={style}>
      {children}
    </button>
  )
}
