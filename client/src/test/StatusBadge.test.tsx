import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge';

describe('StatusBadge', () => {
  it('renders idle status', () => {
    render(<StatusBadge status="idle" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('idle');
  });

  it('renders running status', () => {
    render(<StatusBadge status="running" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('running');
  });

  it('renders needs attention status', () => {
    render(<StatusBadge status="needs attention" />);
    expect(screen.getByTestId('status-badge')).toHaveTextContent('needs attention');
  });
});
