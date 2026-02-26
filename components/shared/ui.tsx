'use client';

import React from 'react';

// ─── Button ───────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white border-transparent',
  success: 'bg-green-700 hover:bg-green-600 text-white border-transparent',
  danger: 'bg-red-700 hover:bg-red-600 text-white border-transparent',
  warning: 'bg-yellow-600 hover:bg-yellow-500 text-white border-transparent',
  ghost: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-600',
  outline: 'bg-transparent hover:bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center gap-2 font-medium border transition-all duration-150 cursor-pointer',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </button>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps {
  children: React.ReactNode;
  className?: string;
  noPad?: boolean;
}

export function Card({ children, className = '', noPad = false }: CardProps) {
  return (
    <div
      className={[
        'bg-slate-900 border border-slate-700/60 rounded-2xl',
        noPad ? '' : 'p-5',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────

type AlertVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const alertClasses: Record<AlertVariant, string> = {
  success: 'bg-green-950/60 border-green-800/60 text-green-300',
  warning: 'bg-yellow-950/60 border-yellow-800/60 text-yellow-300',
  danger: 'bg-red-950/60 border-red-800/60 text-red-300',
  info: 'bg-blue-950/60 border-blue-800/60 text-blue-300',
  neutral: 'bg-slate-800/60 border-slate-700/60 text-slate-300',
};

const alertIcons: Record<AlertVariant, string> = {
  success: '✓',
  warning: '⚠',
  danger: '✕',
  info: 'ℹ',
  neutral: '•',
};

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  className?: string;
  icon?: string;
}

export function Alert({
  variant = 'info',
  title,
  children,
  className = '',
  icon,
}: AlertProps) {
  return (
    <div
      className={[
        'border rounded-xl p-4',
        alertClasses[variant],
        className,
      ].join(' ')}
    >
      <div className="flex gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">
          {icon ?? alertIcons[variant]}
        </span>
        <div className="flex-1 min-w-0">
          {title && (
            <p className="font-semibold text-sm mb-1">{title}</p>
          )}
          <div className="text-sm leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'blue';

const badgeClasses: Record<BadgeVariant, string> = {
  success: 'bg-green-900/50 text-green-300 border-green-800/50',
  warning: 'bg-yellow-900/50 text-yellow-300 border-yellow-800/50',
  danger: 'bg-red-900/50 text-red-300 border-red-800/50',
  info: 'bg-blue-900/50 text-blue-300 border-blue-800/50',
  neutral: 'bg-slate-800 text-slate-300 border-slate-700',
  blue: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
};

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
        badgeClasses[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
}

// ─── NumberInput ──────────────────────────────────────────────────────────────

interface NumberInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  className?: string;
}

export function NumberInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 0.1,
  placeholder = '0',
  hint,
  required = false,
  className = '',
}: NumberInputProps) {
  return (
    <div className={['flex flex-col gap-1.5', className].join(' ')}>
      <label className="text-sm font-medium text-slate-300">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
        {unit && (
          <span className="text-slate-500 font-normal ml-1">({unit})</span>
        )}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all w-full"
      />
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) {
    return <div className="border-t border-slate-700/60 my-4" />;
  }
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1 border-t border-slate-700/60" />
      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
        {label}
      </span>
      <div className="flex-1 border-t border-slate-700/60" />
    </div>
  );
}

// ─── StepHeader ───────────────────────────────────────────────────────────────

interface StepHeaderProps {
  tier?: string;
  step?: string;
  title: string;
  subtitle?: string;
}

export function StepHeader({ tier, step, title, subtitle }: StepHeaderProps) {
  return (
    <div className="mb-6">
      {(tier || step) && (
        <div className="flex items-center gap-2 mb-2">
          {tier && (
            <Badge variant="blue">{tier}</Badge>
          )}
          {step && (
            <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">
              {step}
            </span>
          )}
        </div>
      )}
      <h2 className="text-xl font-bold text-slate-100 leading-tight">{title}</h2>
      {subtitle && (
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">{subtitle}</p>
      )}
    </div>
  );
}

// ─── RadioGroup ───────────────────────────────────────────────────────────────

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
}

interface RadioGroupProps {
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}

export function RadioGroup({
  label,
  options,
  value,
  onChange,
  name,
}: RadioGroupProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <p className="text-sm font-medium text-slate-300 mb-1">{label}</p>
      )}
      {options.map((opt) => (
        <label
          key={opt.value}
          className={[
            'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
            value === opt.value
              ? 'border-blue-500/60 bg-blue-950/30'
              : 'border-slate-700/60 bg-slate-800/30 hover:border-slate-600',
          ].join(' ')}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-slate-200">
                {opt.label}
              </span>
              {opt.badge && (
                <Badge variant={opt.badgeVariant ?? 'neutral'}>
                  {opt.badge}
                </Badge>
              )}
            </div>
            {opt.description && (
              <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
            )}
          </div>
        </label>
      ))}
    </div>
  );
}

// ─── CheckboxItem ─────────────────────────────────────────────────────────────

interface CheckboxItemProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  variant?: 'default' | 'danger' | 'warning';
}

export function CheckboxItem({
  label,
  description,
  checked,
  onChange,
  variant = 'default',
}: CheckboxItemProps) {
  const borderClass =
    variant === 'danger'
      ? 'border-red-700/40 bg-red-950/20'
      : variant === 'warning'
      ? 'border-yellow-700/40 bg-yellow-950/20'
      : 'border-slate-700/60 bg-slate-800/30';

  return (
    <label
      className={[
        'flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all',
        borderClass,
      ].join(' ')}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 accent-blue-500 w-4 h-4 flex-shrink-0"
      />
      <div>
        <p className="text-sm font-medium text-slate-200">{label}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );
}
