import { describe, expect, it } from 'vitest';
import { buildTestApp } from './helpers/buildTestApp';

describe('health and unknown routes', () => {
  it('GET /api/health returns ok', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('sends security headers (helmet) and no framework fingerprint', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/health' });
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('unknown routes use the standard error shape', async () => {
    const res = await buildTestApp().inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toEqual({ error: { code: 'NOT_FOUND', message: 'Route not found' } });
  });
});
