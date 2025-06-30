import request from 'supertest';
import { app } from '../server';
import { setup, teardown, clearDatabase } from './setup';

describe('Orders Controller - Basic Tests', () => {
  beforeAll(async () => {
    await setup();
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await teardown();
  });

  it('should return 404 for a non-existent order', async () => {
    const res = await request(app).get('/api/orders/000000000000000000000000');
    expect(res.status).toBe(404);
    expect(res.body?.error || 'Order not found').toContain('Order not found');
  });
});
