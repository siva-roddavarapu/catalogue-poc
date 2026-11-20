import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@catalogue/shared';
import { ApiClientError, apiClient } from '../src/api/client';
import { HomePage } from '../src/modules/home/HomePage';

vi.mock('../src/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/client')>();
  return { ...actual, apiClient: { getFeatured: vi.fn() } };
});
const getFeatured = vi.mocked(apiClient.getFeatured);

const product = (id: number): Product => ({
  id,
  title: `Product ${id}`,
  price: 10,
  currency: 'USD',
  description: '',
  category: { slug: 'electronics', name: 'Electronics' },
  image: `https://images.example.test/${id}.jpg`,
});

function renderHome() {
  render(
    <MemoryRouter>
      <HomePage />
    </MemoryRouter>,
  );
}

describe('Home page (AC1)', () => {
  beforeEach(() => {
    getFeatured.mockReset();
  });

  it('shows the 5 featured products as tiles linking to their pages, in API order', async () => {
    getFeatured.mockResolvedValue([7, 1, 4, 6, 2].map(product));
    renderHome();

    const list = await screen.findByRole('list');
    const tiles = within(list).getAllByRole('link');
    expect(tiles).toHaveLength(5);
    expect(tiles.map((tile) => tile.getAttribute('href'))).toEqual([
      '/product/7',
      '/product/1',
      '/product/4',
      '/product/6',
      '/product/2',
    ]);
  });

  it('shows a retry-able error when the API fails', async () => {
    getFeatured.mockRejectedValue(
      new ApiClientError(502, 'UPSTREAM_ERROR', 'Catalogue unavailable.'),
    );
    renderHome();
    expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue unavailable.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  it('shows an empty state when there are no featured products', async () => {
    getFeatured.mockResolvedValue([]);
    renderHome();
    expect(await screen.findByText('No featured products right now.')).toBeInTheDocument();
  });
});
