import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export interface LoadingSkeletonProps {
  rows?: number;
  height?: number;
}

export function LoadingSkeleton({ rows = 3, height = 32 }: LoadingSkeletonProps) {
  return (
    <Stack spacing={1} data-testid="loading-skeleton">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} variant="rounded" height={height} />
      ))}
    </Stack>
  );
}
