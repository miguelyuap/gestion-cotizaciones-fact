'use client';

import React from 'react';
import { FileText, Plus } from 'lucide-react';
import Link from 'next/link';
import Button from './Button';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ElementType;
}

export function EmptyState({
  title = 'No se encontraron documentos',
  description = 'No hay documentos que coincidan con los filtros aplicados o aún no has creado ninguno.',
  actionLabel = 'Nuevo documento',
  actionHref = '/documents/new',
  onAction,
  icon: Icon = FileText,
}: EmptyStateProps) {
  return (
    <div className="p-12 text-center space-y-4 max-w-md mx-auto">
      <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
      </div>
      {(actionHref || onAction) && (
        <div className="pt-2">
          {actionHref ? (
            <Link href={actionHref}>
              <Button size="sm" icon={Plus}>
                {actionLabel}
              </Button>
            </Link>
          ) : (
            <Button size="sm" icon={Plus} onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
