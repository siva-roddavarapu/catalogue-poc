import { describe, expect, it } from 'vitest';
import { buildTestApp, testConfig } from './helpers/buildTestApp';

const valid = {
  productId: 4,
  name: '  Ada Lovelace ',
  email: 'ada@example.com',
  phone: '+44 (0)20 1234-5678',
  message: 'Is this available in rose gold?',
};

const post = (app: ReturnType<typeof buildTestApp>, body: unknown, remoteAddress = '127.0.0.1') =>
  app.inject({ method: 'POST', url: '/api/enquiries', payload: body as object, remoteAddress });

describe('POST /api/enquiries (AC5)', () => {
  it('accepts a valid enquiry: 202 with an id, and one email to the sales inbox', async () => {
    const app = buildTestApp();
    const res = await post(app, valid);

    expect(res.statusCode).toBe(202);
    expect(res.json().id).toMatch(/^[0-9a-f-]{36}$/);
    expect(app.outbox.sent).toHaveLength(1);

    const [email] = app.outbox.sent;
    expect(email).toMatchObject({
      to: testConfig.SALES_INBOX,
      from: testConfig.SMTP_FROM,
      replyTo: { name: 'Ada Lovelace', address: 'ada@example.com' },
      subject: 'New enquiry: Gold Bracelet', // server-side title, not anything the client sent
    });
    expect(email?.text).toContain(res.json().id);
    expect(email?.text).toContain('Price:   $40.99');
    expect(email?.text).toContain('http://localhost:5173/product/4');
    expect(email?.text).toContain('Is this available in rose gold?');
  });

  it('ignores product details sent by the client', async () => {
    const app = buildTestApp();
    await post(app, { ...valid, title: 'FREE GOLD', price: 0 });
    expect(app.outbox.sent[0]?.subject).toBe('New enquiry: Gold Bracelet');
    expect(app.outbox.sent[0]?.text).not.toContain('FREE GOLD');
  });

  it('accepts an enquiry without the optional phone and message', async () => {
    const app = buildTestApp();
    const res = await post(app, {
      productId: 4,
      name: 'Ada',
      email: 'ada@example.com',
      phone: '',
      message: '',
    });
    expect(res.statusCode).toBe(202);
    expect(app.outbox.sent[0]?.text).toContain('Phone:   not given');
  });

  it('rejects an invalid body with 400 and per-field errors, and sends nothing', async () => {
    const app = buildTestApp();
    const res = await post(app, { productId: 4, name: 'A', email: 'nope', phone: 'call me' });

    expect(res.statusCode).toBe(400);
    const { fieldErrors } = res.json().error.details;
    expect(Object.keys(fieldErrors).sort()).toEqual(['email', 'name', 'phone']);
    expect(app.outbox.sent).toHaveLength(0);
  });

  it('rejects a line break in the name (header injection)', async () => {
    const app = buildTestApp();
    const res = await post(app, { ...valid, name: 'Ada\r\nBcc: victim@example.com' });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.details.fieldErrors.name).toBeDefined();
    expect(app.outbox.sent).toHaveLength(0);
  });

  it('returns 404 for an unknown product, and sends nothing', async () => {
    const app = buildTestApp();
    const res = await post(app, { ...valid, productId: 999 });
    expect(res.statusCode).toBe(404);
    expect(app.outbox.sent).toHaveLength(0);
  });

  it('returns a safe, retry-able 502 when the email provider fails', async () => {
    const app = buildTestApp({
      email: {
        send: async () => {
          throw new Error('ECONNREFUSED 127.0.0.1:1025');
        },
      },
    });
    const res = await post(app, valid);
    expect(res.statusCode).toBe(502);
    expect(res.json().error.code).toBe('UPSTREAM_ERROR');
    expect(res.body).not.toContain('ECONNREFUSED'); // no internals leaked
  });

  it('rate-limits a client after 5 enquiries a minute, per IP', async () => {
    const app = buildTestApp();
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) codes.push((await post(app, valid, '10.0.0.1')).statusCode);
    expect(codes).toEqual([202, 202, 202, 202, 202, 429]);

    const blocked = await post(app, valid, '10.0.0.1');
    expect(blocked.json().error.code).toBe('RATE_LIMITED');
    // A different client is unaffected.
    expect((await post(app, valid, '10.0.0.2')).statusCode).toBe(202);
  });

  it('refuses oversized bodies', async () => {
    const res = await post(buildTestApp(), { ...valid, message: 'x'.repeat(20_000) });
    expect(res.statusCode).toBe(413);
  });
});
