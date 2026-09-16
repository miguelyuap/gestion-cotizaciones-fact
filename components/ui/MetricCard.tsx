'use client';

import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  variant?: 'neutral' | 'gold' | 'rose' | 'emerald';
  className?: string;
}

const valueVariantClasses = {
  neutral: 'text-slate-900 dark:text-white',
  gold: 'text-amber-600 dark:text-amber-400 font-extrabold',
  rose: 'text-rose-600 dark:text-rose-400 font-extrabold',
  emerald: 'text-emerald-600 dark:text-emerald-400 font-extrabold',
};

export function MetricCard({ label, value, variant = 'neutral', className = '' }: MetricCardProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold tracking-tight">
        {label}
      </p>
      <p className={`text-2xl sm:text-3xl font-bold tracking-tight ${valueVariantClasses[variant]}`}>
        {value}
      </p>
    </div>
  );
}

export default MetricCard;
