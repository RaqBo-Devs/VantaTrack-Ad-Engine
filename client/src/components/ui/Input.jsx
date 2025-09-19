import { clsx } from 'clsx';

export function Input({
  label,
  error,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && <label className="form-label">{label}</label>}
      <input
        className={clsx(
          'form-input',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}

export function Select({
  label,
  error,
  children,
  className = '',
  ...props
}) {
  return (
    <div className="space-y-2">
      {label && <label className="form-label">{label}</label>}
      <select
        className={clsx(
          'form-input',
          error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-red-600 text-sm">{error}</p>}
    </div>
  );
}