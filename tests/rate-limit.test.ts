import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getClientIp, tooManyRequests } from '../lib/rate-limit';

test('getClientIp prefers the first x-forwarded-for address', () => {
  const request = new Request('http://localhost', {
    headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1', 'x-real-ip': '10.0.0.2' },
  });
  assert.equal(getClientIp(request), '203.0.113.7');
});

test('getClientIp falls back to x-real-ip', () => {
  const request = new Request('http://localhost', {
    headers: { 'x-real-ip': '198.51.100.4' },
  });
  assert.equal(getClientIp(request), '198.51.100.4');
});

test('getClientIp returns unknown when no headers are present', () => {
  assert.equal(getClientIp(new Request('http://localhost')), 'unknown');
});

test('tooManyRequests returns 429 with Retry-After', async () => {
  const response = tooManyRequests({
    allowed: false,
    remaining: 0,
    retryAfterSeconds: 42,
  });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '42');
  const body = await response.json();
  assert.match(body.error, /Too many requests/);
});
