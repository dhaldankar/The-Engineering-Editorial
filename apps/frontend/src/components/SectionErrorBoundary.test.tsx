import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SectionErrorBoundary } from './SectionErrorBoundary';

function Bomb(): JSX.Element {
  throw new Error('boom');
}

describe('SectionErrorBoundary', () => {
  it('isolates a thrown error in a child without propagating past the boundary', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <div>
        <SectionErrorBoundary>
          <Bomb />
        </SectionErrorBoundary>
        <div>Sibling content</div>
      </div>,
    );
    expect(screen.getByText('This section failed to load.')).toBeInTheDocument();
    expect(screen.getByText('Sibling content')).toBeInTheDocument();
    spy.mockRestore();
  });
});
