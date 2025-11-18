import useSWR, { type SWRConfiguration } from 'swr';

interface UseSWRDataReturn<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: Error | undefined;
  mutate: () => void;
}

/**
 * Wrapper around useSWR with consistent loading/error state
 * @param key - SWR key (null to disable fetching)
 * @param fetcher - Fetch function
 * @param config - SWR configuration options
 */
export function useSWRData<T>(
  key: string | null,
  fetcher: (key: string) => Promise<T>,
  config?: SWRConfiguration
): UseSWRDataReturn<T> {
  const { data, error, mutate } = useSWR<T>(key, fetcher, config);

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
  };
}
