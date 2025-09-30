import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Ocean Chat header', () => {
  render(<App />);
  const header = screen.getByText(/Ocean Chat/i);
  expect(header).toBeInTheDocument();
});
