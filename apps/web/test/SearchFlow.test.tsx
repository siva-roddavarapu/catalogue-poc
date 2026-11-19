import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@catalogue/shared';
import { apiClient } from '../src/api/client';
import { App } from '../src/App';

vi.mock('../src/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/client')>();
  return {
    ...actual,
    apiClient: { getCategories: vi.fn(), getFeatured: vi.fn(), searchProducts: vi.fn() },
  };
});
const api = vi.mocked(apiClient);

const product = (id: number, title: string): Product => ({
  id,
  title,
  price: 10,
  currency: 'USD',
  description: '',
  category: { slug: 'electronics', name: 'Electronics' },
  image: `https://images.example.test/${id}.jpg`,
});

function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Search (AC3)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.getCategories.mockResolvedValue([]);
    // The home page shows other products: they must disappear once we search.
    api.getFeatured.mockResolvedValue([product(1, 'Backpack'), product(2, 'Gold Ring')]);
  });

  it('typing a term and clicking Search shows only the matching products', async () => {
    api.searchProducts.mockResolvedValue([
      product(9, 'Portable Hard Drive'),
      product(10, 'SSD Drive'),
    ]);
    renderApp('/');
    await screen.findByText('Backpack');

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), '  drive ');
    await userEvent.click(screen.getByRole('button', { name: 'Search' }));

    expect(await screen.findByRole('heading', { name: /Results for .drive./ })).toBeInTheDocument();
    expect(api.searchProducts).toHaveBeenCalledWith('drive'); // trimmed
    const main = screen.getByRole('main');
    const titles = within(main)
      .getAllByRole('link')
      .map((link) => link.textContent);
    expect(titles).toHaveLength(2);
    expect(titles.join()).toMatch(/Portable Hard Drive.*SSD Drive/);
    expect(within(main).queryByText('Backpack')).not.toBeInTheDocument();
  });

  it('pressing Enter also searches', async () => {
    api.searchProducts.mockResolvedValue([]);
    renderApp('/');
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), 'hat{Enter}');
    expect(await screen.findByText(/No products match .hat./)).toBeInTheDocument();
  });

  it('keeps the Search button disabled for a blank term', async () => {
    renderApp('/');
    const button = screen.getByRole('button', { name: 'Search' });
    expect(button).toBeDisabled();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search products' }), '   ');
    expect(button).toBeDisabled();
    expect(api.searchProducts).not.toHaveBeenCalled();
  });

  it('shows the searched term in the box when landing on a results URL', async () => {
    api.searchProducts.mockResolvedValue([]);
    renderApp('/search?q=ring');
    expect(screen.getByRole('searchbox', { name: 'Search products' })).toHaveValue('ring');
    expect(await screen.findByText(/No products match .ring./)).toBeInTheDocument();
  });
});
