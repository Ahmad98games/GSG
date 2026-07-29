'use client'
import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'

interface OptimisticMutationOptions<TData, TError, TVariables, TContext> 
  extends Omit<UseMutationOptions<TData, TError, TVariables, TContext>, 'onMutate' | 'onError' | 'onSettled'> {
  queryKey: unknown[]
  optimisticUpdate?: (oldData: any, variables: TVariables) => any
  updateFn?: (oldData: any, variables: TVariables) => any
  successMessage?: string
  errorMessage?: string
  undoDescription?: string
  undoFn?: (oldData: any, variables: TVariables) => any
  invalidateKeys?: unknown[][]
}

export function useOptimisticMutation<TData = any, TError = any, TVariables = any, TContext = any>(
  options: OptimisticMutationOptions<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient()
  const { queryKey, optimisticUpdate, updateFn, mutationFn, ...rest } = options
  const activeUpdateFn = optimisticUpdate || updateFn

  const mutation = useMutation({
    mutationFn,
    ...rest,
    onMutate: async (variables: TVariables) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(queryKey)

      // Optimistically update to the new value
      if (activeUpdateFn) {
        queryClient.setQueryData(queryKey, (old: any) => activeUpdateFn(old, variables))
      }

      // Return a context object with the snapshotted value
      return { previousData } as any
    },
    onError: (err: TError, variables: TVariables, context: any) => {
      // Revert back to the snapshotted value if the mutation fails
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },
    onSettled: () => {
      // Always invalidate/refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey })
      if (options.invalidateKeys) {
        options.invalidateKeys.forEach(key => {
          queryClient.invalidateQueries({ queryKey: key })
        })
      }
    },
  })

  return {
    ...mutation,
    mutate: mutation.mutateAsync,
  } as any
}
