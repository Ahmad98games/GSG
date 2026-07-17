'use client'

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/useToast'
import { notify } from '@/stores/notificationStore'
import { queueFailedOperation } from '@/lib/sync/offlineQueue'
import { createClient } from '@/lib/supabase/client'

export interface OptimisticMutationOptions<TData, TVariables> {
  // The query keys whose cache to update optimistically
  queryKey: unknown[]

  // Transform variables into the optimistic update — what to show immediately
  optimisticUpdate: (
    current: TData[],
    variables: TVariables
  ) => TData[]

  // The actual async operation
  mutationFn: (variables: TVariables) => Promise<void>

  // After success, invalidate these queries to get fresh server data
  invalidateKeys?: unknown[][]

  // Success message
  successMessage?: string

  // Error message
  errorMessage?: string

  // Whether to add to undo stack
  undoDescription?: string

  // How to reverse the operation
  undoFn?: (variables: TVariables) => Promise<void>
}

export function useOptimisticMutation<
  TData extends { id: string },
  TVariables
>({
  queryKey,
  optimisticUpdate,
  mutationFn,
  invalidateKeys = [],
  successMessage,
  errorMessage,
  undoDescription,
  undoFn,
}: OptimisticMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()
  const toast = useToast()

  const mutate = useCallback(async (
    variables: TVariables,
    options?: {
      onSuccess?: () => void
      onError?: (err: Error) => void
    }
  ) => {
    // Snapshot current cache state so we can roll back on failure
    const previousData = queryClient.getQueryData<any>(queryKey)

    // Apply optimistic update to cache immediately
    queryClient.setQueryData<any>(
      queryKey,
      (old: any) => {
        if (Array.isArray(old)) {
          return optimisticUpdate(old, variables)
        }
        const updatedArray = optimisticUpdate(old ? [old] : [], variables)
        return updatedArray[0] || old
      }
    )

    // Attempt the actual operation in the background
    try {
      await mutationFn(variables)

      // Success — invalidate to get real server data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey }),
        ...invalidateKeys.map(key =>
          queryClient.invalidateQueries({ queryKey: key })
        ),
      ])

      if (successMessage) {
        toast.success(successMessage)
      }

      // Register undo if provided
      if (undoDescription && undoFn) {
        const { pushAction } = await import(
          '@/stores/undoStore'
        ).then(m => m.useUndoStore.getState())

        pushAction({
          description: undoDescription,
          undo: () => undoFn(variables),
        })
      }

      options?.onSuccess?.()

    } catch (err: any) {
      // FAILURE — roll back the optimistic update
      queryClient.setQueryData(queryKey, previousData)

      // Queue for retry when connection returns
      await queueFailedOperation({
        queryKey,
        variables,
        mutationFn,
        successMessage,
      })

      const message = errorMessage || 'Could not save. Will retry when online.'
      toast.error('Sync Queued', message)

      // Add to notification center
      notify.warning(
        'Action queued for sync',
        'Your change was saved locally and will sync when connection returns.'
      )

      options?.onError?.(err)
    }
  }, [
    queryClient, queryKey,
    optimisticUpdate, mutationFn,
    invalidateKeys, successMessage,
    errorMessage, undoDescription, undoFn,
  ])

  return { mutate }
}
