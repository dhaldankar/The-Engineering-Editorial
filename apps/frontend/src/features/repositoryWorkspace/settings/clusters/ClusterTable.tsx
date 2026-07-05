import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import IconButton from '@mui/material/IconButton';
import EditIcon from '@mui/icons-material/Edit';
import { StatusChip } from '../../../../components/StatusChip';
import type { ClusterDTO, ClusterCurationStatus } from '../../../../types/cluster';
import type { StatusKind } from '../../../../theme/statusColors';

const CURATION_KIND: Record<ClusterCurationStatus, StatusKind> = {
  auto: 'research',
  confirmed: 'success',
  renamed: 'success',
  manual: 'warning',
  archived: 'danger',
};

interface ClusterTableProps {
  clusters: ClusterDTO[];
  onEdit: (cluster: ClusterDTO) => void;
}

export function ClusterTable({ clusters, onEdit }: ClusterTableProps) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>File pattern</TableCell>
          <TableCell>Curation</TableCell>
          <TableCell align="right">Files</TableCell>
          <TableCell />
        </TableRow>
      </TableHead>
      <TableBody>
        {clusters.map((cluster) => (
          <TableRow key={cluster.id}>
            <TableCell>{cluster.name}</TableCell>
            <TableCell>
              <code>{cluster.filePattern}</code>
            </TableCell>
            <TableCell>
              <StatusChip label={cluster.curationStatus} kind={CURATION_KIND[cluster.curationStatus]} />
            </TableCell>
            <TableCell align="right">{cluster.fileCount}</TableCell>
            <TableCell align="right">
              <IconButton size="small" aria-label={`Edit ${cluster.name}`} onClick={() => onEdit(cluster)}>
                <EditIcon fontSize="small" />
              </IconButton>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
