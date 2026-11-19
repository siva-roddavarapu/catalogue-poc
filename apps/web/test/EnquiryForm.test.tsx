import { render, screen } from '@testing-library/react';
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
    apiClient: { getCategories: vi.fn(), getProduct: vi.fn(), submitEnquiry: vi.fn() },
  };
});
const api = vi.mocked(apiClient);

const bracelet: Product = {
  id: 4,
  title: 'Gold Bracelet',
  price: 40.99,
  currency: 'USD',
  description: '',
  category: { slug: 'jewelery', name: 'Jewelery' },
  image: 'https://images.example.test/4.jpg',
};

async function openEnquiry() {
  render(
    <MemoryRouter initialEntries={['/product/4/enquire']}>
      <App />
    </MemoryRouter>,
  );
  await screen.findByRole('heading', { name: 'Enquire about Gold Bracelet' });
}

const input = (name: string) => screen.getByLabelText(name);
const send = () => userEvent.click(screen.getByRole('button', { name: /Send enquiry|Try again/ }));

describe('Enquiry form (AC5)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.getCategories.mockResolvedValue([]);
    api.getProduct.mockResolvedValue(bracelet);
  });

  it('shows validation errors next to the fields and does not send', async () => {
    await openEnquiry();
    await userEvent.type(input('Email'), 'not-an-email');
    await userEvent.type(input('Phone (optional)'), 'abc');
    await send();

    expect(screen.getByText('Enter your name (at least 2 characters)')).toBeInTheDocument();
    expect(screen.getByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText(/Phone: 7–20 digits/)).toBeInTheDocument();
    expect(input('Name')).toHaveAttribute('aria-invalid', 'true');
    expect(api.submitEnquiry).not.toHaveBeenCalled();
  });

  it('sends the enquiry and replaces the form with a thank-you message', async () => {
    api.submitEnquiry.mockResolvedValue({ id: 'abc' });
    await openEnquiry();
    await userEvent.type(input('Name'), '  Ada Lovelace ');
    await userEvent.type(input('Email'), 'ada@example.com');
    await userEvent.type(input('Message (optional)'), 'Rose gold?');
    await send();

    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(screen.getByText(/sales team will be in touch/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Send enquiry' })).not.toBeInTheDocument();
    expect(api.submitEnquiry).toHaveBeenCalledWith({
      productId: 4,
      name: 'Ada Lovelace', // trimmed by the shared schema
      email: 'ada@example.com',
      message: 'Rose gold?',
    });
  });

  it('keeps the input and offers a retry when sending fails', async () => {
    api.submitEnquiry
      .mockRejectedValueOnce(
        new ApiClientError(502, 'UPSTREAM_ERROR', "We couldn't send your enquiry right now."),
      )
      .mockResolvedValueOnce({ id: 'abc' });
    await openEnquiry();
    await userEvent.type(input('Name'), 'Ada');
    await userEvent.type(input('Email'), 'ada@example.com');
    await send();

    expect(await screen.findByRole('alert')).toHaveTextContent("couldn't send your enquiry");
    expect(input('Name')).toHaveValue('Ada');
    expect(input('Email')).toHaveValue('ada@example.com');

    await send(); // the button now reads "Try again"
    expect(await screen.findByRole('heading', { name: 'Thank you' })).toBeInTheDocument();
    expect(api.submitEnquiry).toHaveBeenCalledTimes(2);
  });

  it('shows field errors returned by the server', async () => {
    api.submitEnquiry.mockRejectedValue(
      new ApiClientError(400, 'VALIDATION_ERROR', 'Invalid request', {
        fieldErrors: { email: ['Enter a valid email address'] },
      }),
    );
    await openEnquiry();
    await userEvent.type(input('Name'), 'Ada');
    await userEvent.type(input('Email'), 'ada@example.com');
    await send();
    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });
});
