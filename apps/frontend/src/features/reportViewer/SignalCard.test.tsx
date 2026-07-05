import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SignalCard } from './SignalCard';

describe('SignalCard', () => {
  it('renders the evidence payload verbatim', () => {
    render(
      <SignalCard
        signal={{
          id: 's1',
          reportId: 'r1',
          headline: 'Review latency spiked',
          severity: 'high',
          narrative: 'Median time-to-first-review doubled.',
          evidence: { fact_id: 'mf_123', value: 42 },
        }}
      />,
    );

    expect(screen.getByText('Review latency spiked')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('fact_id: mf_123')).toBeInTheDocument();
    expect(screen.getByText('value: 42')).toBeInTheDocument();
  });
});
