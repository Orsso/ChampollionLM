import { useSWRData } from './useSWRData';
import { swrFetcher } from '../lib/api';
import type { TokenEstimation } from '../types';
import { useAuth } from './useAuth';

type TokenEstimateParams = {
  sourceIds?: number[];
};

/**
 * Estimate token count for selected sources
 * - sourceIds undefined: Estimate for ALL sources (backend default)
 * - sourceIds empty array: Estimate for NO sources (return null/0 locally)
 * - sourceIds populated: Estimate for specific sources
 */
export function useTokenEstimate(
  projectId: string | number | undefined,
  params: TokenEstimateParams = {}
) {
  const { token } = useAuth();
  const { sourceIds } = params;

  let shouldFetch = false;
  let queryParams = '';

  if (projectId && token) {
    if (sourceIds === undefined) {
      // No specific sources requested -> Fetch all
      shouldFetch = true;
      queryParams = '';
    } else if (sourceIds.length > 0) {
      // Specific sources requested -> Fetch specific
      shouldFetch = true;
      const queryParts = sourceIds.map(id => `source_ids=${id}`);
      queryParams = `?${queryParts.join('&')}`;
    } else {
      // Empty array requested -> Fetch nothing (return 0/null)
      shouldFetch = false;
    }
  }

  const { data, isLoading, isError, mutate } = useSWRData<TokenEstimation>(
    shouldFetch ? `/api/projects/${projectId}/tokens/estimate${queryParams}` : null,
    swrFetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  return {
    estimation: data,
    isLoading,
    isError,
    mutate,
  };
}
