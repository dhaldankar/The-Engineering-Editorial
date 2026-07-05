import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  it('renders the given label', () => {
    render(<StatusChip label="Connected" kind="success" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('renders each accent kind without throwing', () => {
    (['success', 'warning', 'danger', 'research'] as const).forEach((kind) => {
      render(<StatusChip label={kind} kind={kind} />);
      expect(screen.getByText(kind)).toBeInTheDocument();
    });
  });
});
