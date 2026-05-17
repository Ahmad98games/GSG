import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Sidebar state hook — uses localStorage only.
 * Removed supabase.auth.getUser() calls to prevent Navigator Lock contention
 * that was freezing the application when multiple hooks competed for the auth lock.
 */
export const useSidebarState = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [pinnedTabs, setPinnedTabs] = useState<string[]>([]);
  const [lastRoute, setLastRoute] = useState<string>('');
  const isHydrated = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const collapsed = localStorage.getItem('noxis_sidebar_collapsed') === 'true';
    setIsCollapsed(collapsed);

    try {
      const pinned = JSON.parse(localStorage.getItem('noxis_sidebar_pinned') || '[]');
      setPinnedTabs(pinned);
    } catch {
      setPinnedTabs([]);
    }
    
    isHydrated.current = true;
  }, []);

  // Persist to localStorage (only after hydration)
  useEffect(() => {
    if (isHydrated.current) {
      localStorage.setItem('noxis_sidebar_collapsed', String(isCollapsed));
    }
  }, [isCollapsed]);

  useEffect(() => {
    if (isHydrated.current) {
      localStorage.setItem('noxis_sidebar_pinned', JSON.stringify(pinnedTabs));
    }
  }, [pinnedTabs]);

  const toggle = useCallback(() => setIsCollapsed(prev => !prev), []);

  return { isCollapsed, toggle, pinnedTabs, setPinnedTabs, lastRoute, setLastRoute };
};
