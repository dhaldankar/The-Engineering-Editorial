import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetricCard } from './MetricCard';

describe('MetricCard', () => {
  it('renders label and value', () => {
    render(<MetricCard label="PR Cycle Time" value="3.2d" />);
    expect(screen.getByText('PR Cycle Time')).toBeInTheDocument();
    expect(screen.getByText('3.2d')).toBeInTheDocument();
  });

  it('renders the comparison text when previousValue is provided', () => {
    render(<MetricCard label="PR Cycle Time" value="3.2d" previousValue="4.1d" />);
    expect(screen.getByText(/vs prev period: 4.1d/)).toBeInTheDocument();
  });

  it('omits the comparison text when previousValue is absent', () => {
    render(<MetricCard label="PR Cycle Time" value="3.2d" />);
    expect(screen.queryByText(/vs prev period/)).not.toBeInTheDocument();
  });
});
