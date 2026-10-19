'use client'
import React, { createContext, useContext } from 'react'
import { Nav } from '@/components/Nav'

const PublicNavContext = createContext<boolean>(false);

const isRunningInElectron = () => {
  return typeof window !== 'undefined' && (
    !!(window as any).electron ||
    !!(window as any).electronAPI ||
    !!(window as any).electronWindow ||
    navigator.userAgent.toLowerCase().includes('electron')
  );
};

export function PublicNavProvider({ children }: { children: React.ReactNode }) {
  const isElectron = isRunningInElectron();
  return (
    <PublicNavContext.Provider value={true}>
      {!isElectron && <Nav />}
      {children}
    </PublicNavContext.Provider>
  );
}

export default function PublicNavbar() {
  const isRenderedByShell = useContext(PublicNavContext);
  if (isRenderedByShell || isRunningInElectron()) {
    return null;
  }
  return <Nav />;
}
