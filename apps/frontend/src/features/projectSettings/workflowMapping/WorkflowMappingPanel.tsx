import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import {
  getMappings,
  getStatuses,
  inferMappings,
  putMappings,
} from '../../../services/workflowMappingService';
import type { CanonicalPhase, WorkflowMappingPatch } from '../../../types/workflowMapping';
import { ErrorState } from '../../../components/ErrorState';
import { CANONICAL_PHASES, WorkflowMappingRow } from './WorkflowMappingRow';

export function WorkflowMappingPanel() {
  const queryClient = useQueryClient();

  const mappingsQuery = useQuery({ queryKey: ['workflowMappings'], queryFn: getMappings });
  const statusesQuery = useQuery({ queryKey: ['workflowMappingStatuses'], queryFn: getStatuses });

  // Locally staged phase selection per Jira status; not sent to the API until Save.
  const [staged, setStaged] = useState<Record<string, CanonicalPhase | null>>({});
  // Suggestions returned by "Infer unmapped", awaiting explicit confirmation.
  const [inferredSuggestions, setInferredSuggestions] = useState<Record<string, CanonicalPhase>>(
    {},
  );
  const [saveSucceeded, setSaveSucceeded] = useState(false);

  useEffect(() => {
    if (mappingsQuery.data) {
      setStaged((prev) => {
        const next = { ...prev };
        for (const mapping of mappingsQuery.data ?? []) {
          if (!(mapping.jiraStatus in next)) {
            next[mapping.jiraStatus] = mapping.phase;
          }
        }
        return next;
      });
    }
  }, [mappingsQuery.data]);

  useEffect(() => {
    if (statusesQuery.data) {
      setStaged((prev) => {
        const next = { ...prev };
        for (const status of statusesQuery.data ?? []) {
          if (!(status in next)) {
            next[status] = null;
          }
        }
        return next;
      });
    }
  }, [statusesQuery.data]);

  const inferMutation = useMutation({
    mutationFn: inferMappings,
    onSuccess: (suggestions) => {
      setInferredSuggestions((prev) => {
        const next = { ...prev };
        for (const suggestion of suggestions) {
          if (suggestion.phase && (staged[suggestion.jiraStatus] ?? null) === null) {
            next[suggestion.jiraStatus] = suggestion.phase;
          }
        }
        return next;
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: (patch: WorkflowMappingPatch) => putMappings(patch),
    onSuccess: () => {
      setSaveSucceeded(true);
      queryClient.invalidateQueries({ queryKey: ['workflowMappings'] });
    },
  });

  const allStatuses = Array.from(
    new Set([
      ...(statusesQuery.data ?? []),
      ...(mappingsQuery.data ?? []).map((mapping) => mapping.jiraStatus),
    ]),
  );

  function handlePhaseChange(jiraStatus: string, phase: CanonicalPhase | null) {
    setStaged((prev) => ({ ...prev, [jiraStatus]: phase }));
    if (phase !== null) {
      setInferredSuggestions((prev) => {
        if (!(jiraStatus in prev)) return prev;
        const next = { ...prev };
        delete next[jiraStatus];
        return next;
      });
    }
  }

  function handleConfirmInferred(jiraStatus: string) {
    const suggestedPhase = inferredSuggestions[jiraStatus];
    if (!suggestedPhase) return;
    setStaged((prev) => ({ ...prev, [jiraStatus]: suggestedPhase }));
    setInferredSuggestions((prev) => {
      const next = { ...prev };
      delete next[jiraStatus];
      return next;
    });
  }

  function handleSave() {
    setSaveSucceeded(false);
    const patch: WorkflowMappingPatch = Object.entries(staged)
      .filter(([, phase]) => phase !== null)
      .map(([jiraStatus, phase]) => ({ jiraStatus, phase }));
    saveMutation.mutate(patch);
  }

  const mappedCount = Object.values(staged).filter((phase) => phase !== null).length;
  const unmappedCount = allStatuses.length - mappedCount;

  if (mappingsQuery.isLoading || statusesQuery.isLoading) {
    return <Typography>Loading…</Typography>;
  }

  if (mappingsQuery.isError || statusesQuery.isError) {
    return <ErrorState message="Failed to load workflow mappings." />;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Lifecycle
          </Typography>
          <Typography variant="h5">JIRA Workflow Mapping</Typography>
          <Typography variant="body2" color="text.secondary">
            Map this Project&apos;s JIRA statuses to the six canonical phases.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            onClick={() => inferMutation.mutate()}
            disabled={inferMutation.isPending}
          >
            Infer unmapped
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={saveMutation.isPending}>
            Save
          </Button>
        </Stack>
      </Box>

      <Stack direction="row" spacing={1} mb={2}>
        {CANONICAL_PHASES.map((phase) => (
          <Chip key={phase} label={phase} size="small" />
        ))}
      </Stack>

      {saveSucceeded && (
        <Alert severity="success" sx={{ mb: 2 }} data-testid="workflow-mapping-save-success">
          Workflow mapping saved.
        </Alert>
      )}
      {saveMutation.isError && (
        <ErrorState message="Failed to save workflow mapping. Your staged edits are preserved." />
      )}
      {inferMutation.isError && (
        <ErrorState message="Failed to infer unmapped statuses." />
      )}

      <Box mb={1}>
        <Chip label={`${mappedCount} mapped · ${unmappedCount} unmapped`} size="small" />
      </Box>

      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Jira status</TableCell>
            <TableCell>Canonical phase</TableCell>
            <TableCell>State</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {allStatuses.map((jiraStatus) => (
            <WorkflowMappingRow
              key={jiraStatus}
              jiraStatus={jiraStatus}
              phase={staged[jiraStatus] ?? null}
              inferredSuggestion={inferredSuggestions[jiraStatus] ?? null}
              onPhaseChange={handlePhaseChange}
              onConfirmInferred={handleConfirmInferred}
            />
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
