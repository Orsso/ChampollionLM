import { useState } from 'react';
import { extractErrorMessage } from '../utils/errors';

interface AsyncActionState {
  loading: boolean;
  error: string | null;
  success: string | null;
}

interface AsyncActionReturn<T> {
  execute: (action: () => Promise<T>) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  success: string | null;
  reset: () => void;
}

/**
 * Hook for handling async actions with loading/error/success states
 * @param successMessage - Optional success message to set after action completes
 */
export function useAsyncAction<T = void>(
  successMessage?: string
): AsyncActionReturn<T> {
  const [state, setState] = useState<AsyncActionState>({
    loading: false,
    error: null,
    success: null,
  });

  const execute = async (action: () => Promise<T>): Promise<T | null> => {
    setState({ loading: true, error: null, success: null });

    try {
      const result = await action();
      setState({
        loading: false,
        error: null,
        success: successMessage || null,
      });
      return result;
    } catch (err) {
      setState({
        loading: false,
        error: extractErrorMessage(err),
        success: null,
      });
      return null;
    }
  };

  const reset = () => {
    setState({ loading: false, error: null, success: null });
  };

  return {
    execute,
    loading: state.loading,
    error: state.error,
    success: state.success,
    reset,
  };
}
