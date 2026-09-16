'use client';

import React from 'react';

export type BadgeStatus = 'paid' | 'sent' | 'overdue' | 'draft' | 'cancelled';

interface BadgeProps {
  status?: BadgeStatus;
  label?: string;
  variant?: 'emerald' | 'blue' | 'rose' | 'amber' | 'slate';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusPresets: Record<BadgeStatus, { label: string; variant: BadgeProps['variant'] }> = {
  paid: { label: 'Cobrado', variant: 'emerald' },
  sent: { label: 'Enviado', variant: 'blue' },
  overdue: { label: 'Vencido', variant: 'rose' },
  draft: { label: 'Borrador', variant: 'slate' },
  cancelled: { label: 'Cancelado', variant: 'rose' },
};

// Refined light & dark mode exact classes matching Image 1:
const badgeStyles: Record<BadgeProps['variant'] & string, string> = {
  emerald: 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60',
  blue: 'bg-blue-100 dark:bg-blue-950/90 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60',
  rose: 'bg-rose-100 dark:bg-rose-950/90 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60',
  amber: 'bg-amber-100 dark:bg-amber-950/90 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60',
  slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function Badge({ status, label, variant, size = 'md', className = '' }: BadgeProps) {
  const preset = status ? statusPresets[status] : null;
  const finalLabel = label || preset?.label || '';
  const finalVariant = variant || preset?.variant || 'slate';

  return (
    <span
      className={`inline-flex items-center justify-center font-bold rounded-full transition-colors whitespace-nowrap ${
        badgeStyles[finalVariant]
      } ${sizeClasses[size]} ${className}`}
    >
      {finalLabel}
    </span>
  );
}

export default Badge;
