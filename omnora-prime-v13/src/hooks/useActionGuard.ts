import { useState, useCallback, useRef } from 'react'

export function useActionGuard() {
  const executing = useRef(false)

  const guard = useCallback(
    async (action: () => Promise<void>) => {
      // Prevent double-execution when user clicks rapidly
      if (executing.current) return
      executing.current = true
      try {
        await action()
      } finally {
        executing.current = false
      }
    },
    []
  )

  return { guard }
}
