import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import AddIcon from '@mui/icons-material/Add';
import { useRepositoryList } from '../../contexts/RepositoryListContext';
import { RepositoryCard } from './RepositoryCard';
import { RepositorySearchField } from './RepositorySearchField';
import { AddRepositoryDialog } from './AddRepositoryDialog';
import { EmptyState } from '../../components/EmptyState';
import { routePaths } from '../../app/routePaths';
import type { RepositoryDTO } from '../../types/repository';

function matchesQuery(repository: RepositoryDTO, query: string): boolean {
  if (!query) {
    return true;
  }
  const haystack = `${repository.displayName} ${repository.githubOwner}/${repository.githubRepo}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

function AddRepositoryCard({ onClick }: { onClick: () => void }) {
  return (
    <Card variant="outlined" data-testid="add-repository-card">
      <CardActionArea onClick={onClick}>
        <Box p={3} textAlign="center">
          <AddIcon fontSize="large" color="action" />
          <Typography variant="body2" color="text.secondary" mt={1}>
            Connect a repo to this Project
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
}

export function RepositoryLandingPage() {
  const { repositories } = useRepositoryList();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const filteredRepositories = useMemo(
    () => repositories.filter((repository) => matchesQuery(repository, searchQuery)),
    [repositories, searchQuery],
  );

  function handleCardClick(repository: RepositoryDTO) {
    navigate(routePaths.repositoryDashboard(repository.id));
  }

  function handleCreated() {
    // RepositoryListContext reads from the ['repositories'] query cache;
    // invalidate it so the new repository's card appears without a full
    // page reload (Requirement 6.4).
    void queryClient.invalidateQueries({ queryKey: ['repositories'] });
  }

  const hasNoRepositories = repositories.length === 0;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-end" mb={3}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Project
          </Typography>
          <Typography variant="h4" fontWeight="bold">
            Repositories
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <RepositorySearchField onDebouncedChange={setSearchQuery} />
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setIsDialogOpen(true)}>
            Add Repository
          </Button>
        </Stack>
      </Stack>

      {hasNoRepositories ? (
        <Stack spacing={2} alignItems="center">
          <EmptyState
            title="No repositories yet"
            description="Connect a repo to this Project to start syncing data."
          />
          <Box width={{ xs: '100%', sm: 280 }}>
            <AddRepositoryCard onClick={() => setIsDialogOpen(true)} />
          </Box>
        </Stack>
      ) : (
        <Grid container spacing={2}>
          {filteredRepositories.map((repository) => (
            <Grid item key={repository.id} xs={12} sm={6} md={4}>
              <RepositoryCard repository={repository} onClick={handleCardClick} />
            </Grid>
          ))}
          <Grid item xs={12} sm={6} md={4}>
            <AddRepositoryCard onClick={() => setIsDialogOpen(true)} />
          </Grid>
        </Grid>
      )}

      <AddRepositoryDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onCreated={handleCreated}
      />
    </Box>
  );
}
