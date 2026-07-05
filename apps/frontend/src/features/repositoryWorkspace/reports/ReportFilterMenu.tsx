import { useState } from 'react';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListSubheader from '@mui/material/ListSubheader';
import type { ReportStatus } from '../../../types/report';

export interface ReportFilter {
  status: ReportStatus | 'all';
  reportType: string | 'all';
}

export const DEFAULT_REPORT_FILTER: ReportFilter = { status: 'all', reportType: 'all' };

export interface ReportFilterMenuProps {
  filter: ReportFilter;
  reportTypes: string[];
  onChange: (filter: ReportFilter) => void;
}

const STATUS_OPTIONS: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'generating', label: 'Generating' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export function applyReportFilter<T extends { status: ReportStatus; reportType: string }>(
  reports: T[],
  filter: ReportFilter,
): T[] {
  return reports.filter((report) => {
    if (filter.status !== 'all' && report.status !== filter.status) return false;
    if (filter.reportType !== 'all' && report.reportType !== filter.reportType) return false;
    return true;
  });
}

export function ReportFilterMenu({ filter, reportTypes, onChange }: ReportFilterMenuProps) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  return (
    <>
      <Button onClick={(event) => setAnchor(event.currentTarget)}>Filter</Button>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        <ListSubheader>Status</ListSubheader>
        {STATUS_OPTIONS.map((option) => (
          <MenuItem
            key={option.value}
            selected={filter.status === option.value}
            onClick={() => onChange({ ...filter, status: option.value })}
          >
            {option.label}
          </MenuItem>
        ))}
        <ListSubheader>Report type</ListSubheader>
        <MenuItem
          selected={filter.reportType === 'all'}
          onClick={() => onChange({ ...filter, reportType: 'all' })}
        >
          All types
        </MenuItem>
        {reportTypes.map((type) => (
          <MenuItem
            key={type}
            selected={filter.reportType === type}
            onClick={() => onChange({ ...filter, reportType: type })}
          >
            {type}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
