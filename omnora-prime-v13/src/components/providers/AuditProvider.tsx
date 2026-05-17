"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import React from 'react';
// src/components/providers/AuditProvider.tsx
import AuditErrorModal from "@/components/ui/AuditErrorModal";

interface AuditContextType {
  reportError: (error: any) => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const reportError = (error: any) => {
    const msg = error?.message || String(error);
    if (msg.includes('PERIOD_LOCKED')) {
      setIsModalOpen(true);
      setLastError(msg);
    } else {
      console.error("Standard System Error:", error);
    }
  };

  return (
    <AuditContext.Provider value={{ reportError }}>
      {children}
      <AuditErrorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        errorMsg={lastError || undefined}
      />
    </AuditContext.Provider>
  );
}

export const useAudit = () => {
  const context =  useContext (AuditContext);
  if (!context) throw new Error("useAudit must be used within AuditProvider");
  return context;
};

