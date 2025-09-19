import { clsx } from 'clsx';

export function Card({ children, className = '', ...props }) {
  return (
    <div className={clsx('card-premium p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function MetricCard({ title, value, subtitle, icon, trend, className = '' }) {
  return (
    <div className={clsx('card-metric', className)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {icon && <div className="text-primary-600">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {trend && (
          <div className={clsx(
            'flex items-center text-sm font-medium',
            trend.direction === 'up' ? 'text-emerald-600' : 'text-red-600'
          )}>
            {trend.direction === 'up' ? '↗' : '↘'} {trend.value}
          </div>
        )}
      </div>
    </div>
  );
}