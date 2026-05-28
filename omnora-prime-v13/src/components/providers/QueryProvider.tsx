"use client";

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useBranchStore } from '@/stores/branchStore';
import { queryClientOptions } from '@/lib/queryClient';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient(queryClientOptions));

  const activeBranchId = useBranchStore(state => state.activeBranchId);

  useEffect(() => {
    // Force re-fetch of all branch-aware data when context changes
    if (activeBranchId) {
      queryClient.invalidateQueries();
    }
  }, [activeBranchId, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

