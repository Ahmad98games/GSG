import { useRouter as useNextRouter, usePathname } from 'next/navigation';
import React, { useCallback } from 'react';

export interface NavigateOptions {
  scroll?: boolean;
}

/**
 * Resilient Navigation Handler for Local Client Transitions.
 * Forces immediate local client transition wrapped in React.startTransition.
 */
export const handleNavigate = (router: ReturnType<typeof useNextRouter>, path: string, options?: NavigateOptions) => {
  React.startTransition(() => {
    router.push(path, options);
  });
};

/**
 * Resilient Router Hook.
 * Wraps Next.js App Router navigation methods in React.startTransition to guarantee
 * non-blocking local routing during offline and online execution.
 */
export function useResilientRouter() {
  const router = useNextRouter();
  const pathname = usePathname();

  const navigateHandler = useCallback(
    (path: string, options?: NavigateOptions) => {
      React.startTransition(() => {
        router.push(path, options);
      });
    },
    [router]
  );

  const push = useCallback(
    (path: string, options?: NavigateOptions) => {
      React.startTransition(() => {
        router.push(path, options);
      });
    },
    [router]
  );

  const replace = useCallback(
    (path: string, options?: NavigateOptions) => {
      React.startTransition(() => {
        router.replace(path, options);
      });
    },
    [router]
  );

  const back = useCallback(() => {
    React.startTransition(() => {
      router.back();
    });
  }, [router]);

  const forward = useCallback(() => {
    React.startTransition(() => {
      router.forward();
    });
  }, [router]);

  const refresh = useCallback(() => {
    React.startTransition(() => {
      router.refresh();
    });
  }, [router]);

  const prefetch = useCallback(
    (path: string, options?: Parameters<typeof router.prefetch>[1]) => {
      try {
        router.prefetch(path, options);
      } catch {
        // Suppress prefetch errors when offline or unhandled
      }
    },
    [router]
  );

  return {
    ...router,
    push,
    replace,
    back,
    forward,
    refresh,
    prefetch,
    handleNavigate: navigateHandler,
    pathname,
  };
}
