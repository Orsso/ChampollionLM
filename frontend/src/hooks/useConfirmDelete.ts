import { useState, useEffect, useCallback } from 'react';

/**
 * useConfirmDelete Hook
 *
 * Manages two-step delete confirmation state with auto-reset timer.
 * Supports both single item and multi-item (ID-based) confirmation patterns.
 *
 * @param timeout - Auto-reset timeout in milliseconds (default: 3000ms)
 *
 * @example Single item deletion
 * ```tsx
 * const { isConfirming, handleDelete, reset } = useConfirmDelete();
 *
 * const onDelete = async () => {
 *   await deleteItem();
 * };
 *
 * <ConfirmDeleteButton
 *   isConfirming={isConfirming}
 *   onDelete={() => handleDelete(onDelete)}
 * />
 * ```
 *
 * @example Multi-item deletion with IDs
 * ```tsx
 * const { confirmingId, handleDelete } = useConfirmDelete<string>();
 *
 * const onDelete = async (id: string) => {
 *   await deleteItem(id);
 * };
 *
 * items.map(item => (
 *   <ConfirmDeleteButton
 *     isConfirming={confirmingId === item.id}
 *     onDelete={() => handleDelete(onDelete, item.id)}
 *   />
 * ))
 * ```
 */
export function useConfirmDelete<T = void>(timeout = 3000) {
  const [confirmingId, setConfirmingId] = useState<T | null>(null);

  // Auto-reset timer
  useEffect(() => {
    if (confirmingId !== null) {
      const timer = setTimeout(() => setConfirmingId(null), timeout);
      return () => clearTimeout(timer);
    }
  }, [confirmingId, timeout]);

  /**
   * Handle delete action with two-step confirmation
   *
   * First call: Sets confirming state
   * Second call (within timeout): Executes the delete action
   */
  const handleDelete = useCallback(
    async (deleteFn: (id?: T) => void | Promise<void>, id?: T) => {
      const targetId = (id ?? null) as T | null;

      if (confirmingId === targetId) {
        // Second click: execute delete
        try {
          await deleteFn(id);
        } finally {
          setConfirmingId(null);
        }
      } else {
        // First click: enter confirming state
        setConfirmingId(targetId);
      }
    },
    [confirmingId]
  );

  /**
   * Manually reset confirming state
   */
  const reset = useCallback(() => {
    setConfirmingId(null);
  }, []);

  /**
   * Check if a specific ID is confirming
   */
  const isConfirmingId = useCallback(
    (id: T) => confirmingId === id,
    [confirmingId]
  );

  return {
    /** Current confirming ID (null if none) */
    confirmingId,
    /** Whether currently in confirming state (for single item) */
    isConfirming: confirmingId !== null,
    /** Handle delete with two-step confirmation */
    handleDelete,
    /** Manually reset confirming state */
    reset,
    /** Check if specific ID is confirming */
    isConfirmingId,
  };
}
