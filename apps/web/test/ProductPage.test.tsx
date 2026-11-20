import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@catalogue/shared';
import { ApiClientError, apiClient } from '../src/api/client';
import { ProductTile } from '../src/components/ProductTile/ProductTile';
import { ProductPage } from '../src/modules/product/ProductPage';

// S1: the API client is the web app's only network boundary, so tests mock it there.
vi.mock('../src/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/api/client')>();
  return { ...actual, apiClient: { getProduct: vi.fn() } };
});
const getProduct = vi.mocked(apiClient.getProduct);

const bracelet: Product = {
  id: 4,
  title: 'Gold Bracelet',
  price: 40.99,
  currency: 'USD',
  description: 'Plated with real gold.',
  category: { slug: 'jewelery', name: 'Jewelery' },
  image: 'https://images.example.test/4.jpg',
};

function renderAt(path: string) {
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<ProductTile product={bracelet} />} />
        <Route path="/product/:id" element={<ProductPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('Product page (AC4)', () => {
  // Braces matter: returning the mock from beforeEach would make Vitest call it as a cleanup hook.
  beforeEach(() => {
    getProduct.mockReset();
  });

  it('clicking a product tile shows that product’s details', async () => {
    getProduct.mockResolvedValue(bracelet);
    renderAt('/');

    await userEvent.click(screen.getByRole('link', { name: /Gold Bracelet/ }));

    expect(await screen.findByRole('heading', { name: 'Gold Bracelet' })).toBeInTheDocument();
    expect(getProduct).toHaveBeenCalledWith(4);
    expect(screen.getByText('$40.99')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Gold Bracelet' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Jewelery' })).toHaveAttribute(
      'href',
      '/category/jewelery',
    );
    expect(screen.getByText('Plated with real gold.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Enquire' })).toHaveAttribute(
      'href',
      '/product/4/enquire',
    );
  });

  it('shows a not-found message for an unknown product', async () => {
    getProduct.mockRejectedValue(new ApiClientError(404, 'NOT_FOUND', 'Product 999 not found'));
    renderAt('/product/999');
    expect(await screen.findByText(/couldn.t find that product/)).toBeInTheDocument();
  });

  it('does not call the API for a malformed id', async () => {
    renderAt('/product/abc');
    expect(await screen.findByText(/couldn.t find that product/)).toBeInTheDocument();
    expect(getProduct).not.toHaveBeenCalled();
  });

  it('shows a retry-able error when the API fails, and recovers', async () => {
    getProduct
      .mockRejectedValueOnce(new ApiClientError(502, 'UPSTREAM_ERROR', 'Catalogue unavailable.'))
      .mockResolvedValueOnce(bracelet);
    renderAt('/product/4');

    expect(await screen.findByRole('alert')).toHaveTextContent('Catalogue unavailable.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('heading', { name: 'Gold Bracelet' })).toBeInTheDocument();
  });
});
