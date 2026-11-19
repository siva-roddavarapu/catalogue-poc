import { describe, expect, it } from 'vitest';
import { buildTestApp } from './helpers/buildTestApp';

describe('health and unknown routes', () => {
  it('GET /api/health returns ok', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('unknown routes use the standard error shape', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});
