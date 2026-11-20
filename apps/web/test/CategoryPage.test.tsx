import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@catalogue/shared';
import { ApiClientError, apiClient } from '../src/api/client';
import { App } from '../src/App';

vi.mock('../src/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/client')>();
  return {
    ...actual,
    apiClient: { getCategories: vi.fn(), getFeatured: vi.fn(), getCategoryProducts: vi.fn() },
  };
});
const api = vi.mocked(apiClient);

const jewelery = { slug: 'jewelery', name: 'Jewelery' };
const product = (id: number): Product => ({
  id,
  title: `Ring ${id}`,
  price: 10,
  currency: 'USD',
  description: '',
  category: jewelery,
  image: `https://images.example.test/${id}.jpg`,
});

function renderApp(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('Category page (AC2)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.getCategories.mockResolvedValue([{ slug: 'electronics', name: 'Electronics' }, jewelery]);
    api.getFeatured.mockResolvedValue([]);
  });

  it('clicking a category link shows its top-rated and additional products', async () => {
    api.getCategoryProducts.mockResolvedValue({
      category: jewelery,
      topRated: [product(5), product(6)],
      others: [product(7)],
    });
    renderApp('/');

    const nav = await screen.findByRole('navigation', { name: 'Categories' });
    await userEvent.click(await within(nav).findByRole('link', { name: 'Jewelery' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Jewelery' })).toBeInTheDocument();
    expect(api.getCategoryProducts).toHaveBeenCalledWith('jewelery');

    const topRated = screen.getByRole('region', { name: 'Top rated' });
    expect(
      within(topRated)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/product/5', '/product/6']);
    const more = screen.getByRole('region', { name: 'More in this category' });
    expect(
      within(more)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href')),
    ).toEqual(['/product/7']);
  });

  it('shows only "More in this category" when the category has no curation', async () => {
    api.getCategoryProducts.mockResolvedValue({
      category: jewelery,
      topRated: [],
      others: [product(7)],
    });
    renderApp('/category/jewelery');

    expect(
      await screen.findByRole('region', { name: 'More in this category' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Top rated' })).not.toBeInTheDocument();
  });

  it('shows a not-found message for an unknown category', async () => {
    api.getCategoryProducts.mockRejectedValue(new ApiClientError(404, 'NOT_FOUND', 'nope'));
    renderApp('/category/hats');
    expect(await screen.findByText(/couldn.t find that category/)).toBeInTheDocument();
  });
});
