import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { apiClient } from '../src/api/client';
import { App } from '../src/App';

vi.mock('../src/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/client')>();
  return { ...actual, apiClient: { getCategories: vi.fn() } };
});

describe('App routing', () => {
  it('renders the header and a not-found page for unknown routes', async () => {
    vi.mocked(apiClient.getCategories).mockResolvedValue([]);
    render(
      <MemoryRouter initialEntries={['/does-not-exist']}>
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Catalogue' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(await screen.findByRole('navigation', { name: 'Categories' })).toBeInTheDocument();
  });
});
