export interface PollingQueryOptionsConfig<T> {
  getStatus: (data: T) => string;
  terminalStatuses: string[];
  intervalMs: number;
  isVisible: boolean;
}

export function createPollingQueryOptions<T>({
  getStatus,
  terminalStatuses,
  intervalMs,
  isVisible,
}: PollingQueryOptionsConfig<T>) {
  return {
    refetchInterval: (query: { state: { data?: T } }) => {
      const data = query.state.data;
      if (data && terminalStatuses.includes(getStatus(data))) {
        return false as const;
      }
      if (!isVisible) {
        return false as const;
      }
      return intervalMs;
    },
    refetchIntervalInBackground: false,
  };
}
