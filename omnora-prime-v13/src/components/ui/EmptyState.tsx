// src/components/ui/EmptyState.tsx
import React from 'react';
import Link from 'next/link';
import { usePersona } from '@/hooks/usePersona';
import { getEmptyStateMessage, PageContext } from '@/lib/emptyStateMessages';
import { format } from 'date-fns';

export function EmptyState({
  icon: Icon,
  title,
  body,
  page,
  action
}: {
  icon: React.ElementType;
  title?: string;
  body?: string;
  page?: PageContext;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}) {
  const { persona, businessId } = usePersona();
  
  const context = React.useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : hour < 21 ? 'evening' : 'night';
    const dayOfWeek = format(now, 'EEEE');
    const dayOfMonth = now.getDate();
    const monthWeek = dayOfMonth <= 7 ? 'first' : dayOfMonth >= 23 ? 'last' : 'middle';
    
    return {
      persona,
      timeOfDay: timeOfDay as any,
      isNewBusiness: false, // Could fetch from business profile created_at
      dayOfWeek,
      monthWeek: monthWeek as any
    };
  }, [persona]);

  const message = page ? getEmptyStateMessage(page, context) : { title, body, action: action?.label };

  const finalTitle = message.title || title;
  const finalBody = message.body || body;
  const finalActionLabel = message.action || action?.label;
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-12 h-12 rounded-sm bg-electric-blue/10 border border-electric-blue/15 flex items-center justify-center mb-4">
        <Icon size={24} className="text-electric-blue/60" />
      </div>
      
      <h3 className="text-base font-medium tracking-tight text-white">
        {finalTitle}
      </h3>
      <p className="mt-1.5 text-sm text-gray-500 max-w-[280px] leading-relaxed">
        {finalBody}
      </p>

      {action && (
        <div className="mt-6">
          {action.href ? (
            <Link 
              href={action.href}
              className="px-4 py-2 border border-electric-blue text-electric-blue text-sm rounded-sm hover:bg-electric-blue/5 transition-all"
            >
              {finalActionLabel}
            </Link>
          ) : (
            <button 
              onClick={action.onClick}
              className="px-4 py-2 border border-electric-blue text-electric-blue text-sm rounded-sm hover:bg-electric-blue/5 transition-all"
            >
              {finalActionLabel}
            </button>
          )}
        </div>
      )}

      <button 
        onClick={() => window.dispatchEvent(new CustomEvent('open-ask-noxis'))}
        className="mt-8 text-[10px] text-gray-600 hover:text-electric-blue font-black uppercase tracking-widest flex items-center gap-2 transition-colors"
      >
        Need help? Ask Noxis →
      </button>
    </div>
  );
}
export default EmptyState;
