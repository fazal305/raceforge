import './Button.css';

const VARIANT_CLASS = {
  primary: 'btn btn--primary',
  secondary: 'btn btn--secondary',
  ghost: 'btn btn--ghost',
  danger: 'btn btn--danger',
};

export function Button({ variant = 'secondary', className = '', children, ...rest }) {
  const classes = `${VARIANT_CLASS[variant] ?? VARIANT_CLASS.secondary} ${className}`.trim();
  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
