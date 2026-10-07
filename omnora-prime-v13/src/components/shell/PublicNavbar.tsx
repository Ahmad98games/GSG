'use client'
import React, { createContext, useContext } from 'react'
import { Nav } from '@/components/Nav'

const PublicNavContext = createContext<boolean>(false);

export function PublicNavProvider({ children }: { children: React.ReactNode }) {
  return (
    <PublicNavContext.Provider value={true}>
      <Nav />
      {children}
    </PublicNavContext.Provider>
  );
}

export default function PublicNavbar() {
  const isRenderedByShell = useContext(PublicNavContext);
  if (isRenderedByShell) {
    return null;
  }
  return <Nav />;
}
