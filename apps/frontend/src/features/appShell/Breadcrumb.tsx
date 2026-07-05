import { useLocation, useParams } from 'react-router-dom';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import { useCurrentProduct } from '../../contexts/CurrentProductContext';
import { useRepositoryList } from '../../contexts/RepositoryListContext';

// Purely derived from route state — no breadcrumb-specific data fetching.
export function Breadcrumb() {
  const { product } = useCurrentProduct();
  const { repositories } = useRepositoryList();
  const location = useLocation();
  const params = useParams();

  const segments: string[] = [];
  if (product) {
    segments.push(product.name);
  }

  const path = location.pathname;
  const repoId = params.repoId ?? path.match(/\/repositories\/([^/]+)/)?.[1];
  if (path.startsWith('/repositories')) {
    segments.push('Repositories');
    if (repoId) {
      const repo = repositories.find((r) => r.id === repoId);
      if (repo) segments.push(repo.displayName);
      if (path.includes('/reports')) segments.push('Reports');
      else if (path.includes('/settings')) segments.push('Settings');
      else segments.push('Dashboard');
    }
  } else if (path.startsWith('/settings')) {
    segments.push('Settings');
  } else if (path.startsWith('/connector')) {
    segments.push('Connector');
  }

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ color: 'inherit' }}>
      {segments.map((segment, index) => (
        <Typography key={`${segment}-${index}`} variant="body2" color="inherit">
          {segment}
        </Typography>
      ))}
    </Breadcrumbs>
  );
}
