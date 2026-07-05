import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { StatusChip } from '../../../components/StatusChip';
import type { CanonicalPhase } from '../../../types/workflowMapping';

export const CANONICAL_PHASES: CanonicalPhase[] = ['backlog', 'ready', 'in_dev', 'str', 'qa', 'done'];

export interface WorkflowMappingRowProps {
  jiraStatus: string;
  phase: CanonicalPhase | null;
  inferredSuggestion: CanonicalPhase | null;
  onPhaseChange: (jiraStatus: string, phase: CanonicalPhase | null) => void;
  onConfirmInferred: (jiraStatus: string) => void;
}

export function WorkflowMappingRow({
  jiraStatus,
  phase,
  inferredSuggestion,
  onPhaseChange,
  onConfirmInferred,
}: WorkflowMappingRowProps) {
  function handleSelectChange(event: SelectChangeEvent<string>) {
    const value = event.target.value;
    onPhaseChange(jiraStatus, value === '' ? null : (value as CanonicalPhase));
  }

  return (
    <TableRow>
      <TableCell>{jiraStatus}</TableCell>
      <TableCell>
        <Select
          size="small"
          displayEmpty
          value={phase ?? ''}
          onChange={handleSelectChange}
          inputProps={{ 'aria-label': `Canonical phase for ${jiraStatus}` }}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">
            <Typography color="text.secondary">— select phase —</Typography>
          </MenuItem>
          {CANONICAL_PHASES.map((canonicalPhase) => (
            <MenuItem key={canonicalPhase} value={canonicalPhase}>
              {canonicalPhase}
            </MenuItem>
          ))}
        </Select>
      </TableCell>
      <TableCell>
        {inferredSuggestion ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <StatusChip label={`inferred: ${inferredSuggestion}?`} kind="research" />
            <Button size="small" onClick={() => onConfirmInferred(jiraStatus)}>
              Confirm
            </Button>
          </Stack>
        ) : (
          <Box>
            <Typography variant="body2" color="text.secondary">
              {phase ? 'mapped' : 'unmapped'}
            </Typography>
          </Box>
        )}
      </TableCell>
    </TableRow>
  );
}
