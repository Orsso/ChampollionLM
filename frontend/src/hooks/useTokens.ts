import { useSWRData } from './useSWRData';
import { swrFetcher } from '../lib/api';
import type { TokenEstimation } from '../types';
import { useAuth } from './useAuth';

type TokenEstimateParams = {
  sourceIds?: number[];
  recordingIds?: number[];
};

/**
 * Estimate token count for selected sources/recordings
 * - Prefer sourceIds when provided
 * - Falls back to recordingIds for backward compatibility
 */
export function useTokenEstimate(
  projectId: string | number | undefined,
  params: TokenEstimateParams = {}
) {
  const { token } = useAuth();

  const { sourceIds = [], recordingIds = [] } = params;

  // Build query params supporting both
  const queryParts: string[] = [];
  if (sourceIds.length > 0) {
    queryParts.push(...sourceIds.map(id => `source_ids=${id}`));
  }
  if (recordingIds.length > 0) {
    queryParts.push(...recordingIds.map(id => `recording_ids=${id}`));
  }
  const queryParams = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';

  const { data, isLoading, isError, mutate } = useSWRData<TokenEstimation>(
    token && projectId ? `/api/projects/${projectId}/tokens/estimate${queryParams}` : null,
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
