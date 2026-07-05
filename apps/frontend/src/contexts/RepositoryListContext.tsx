import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listRepositories } from '../services/repositoriesService';
import type { RepositoryDTO } from '../types/repository';

interface RepositoryListContextValue {
  repositories: RepositoryDTO[];
  isLoading: boolean;
}

const RepositoryListContext = createContext<RepositoryListContextValue | undefined>(undefined);

export function RepositoryListProvider({ children }: { children: ReactNode }) {
  const { data, isLoading } = useQuery({
    queryKey: ['repositories'],
    queryFn: listRepositories,
  });

  const value = useMemo<RepositoryListContextValue>(
    () => ({ repositories: data ?? [], isLoading }),
    [data, isLoading],
  );

  return <RepositoryListContext.Provider value={value}>{children}</RepositoryListContext.Provider>;
}

export function useRepositoryList(): RepositoryListContextValue {
  const context = useContext(RepositoryListContext);
  if (!context) {
    throw new Error('useRepositoryList must be used within a RepositoryListProvider');
  }
  return context;
}
