import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('OrdersController (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should not oversell stock when two orders request the same limited product concurrently', async () => {
    // 1. Create a product with stock = 10
    const prodRes = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Limited E2E Item',
        description: 'Limited edition',
        price: 15.0,
        stock: 10,
        category: 'Toys',
      })
      .expect(201);

    const productId = prodRes.body.id;

    // Retrieve valid customers from DB
    const consumersRes = await request(app.getHttpServer()).get('/consumers?limit=10').expect(200);
    const customers = consumersRes.body.data;

    const customerId1 = customers[0].id;
    const customerId2 = customers[1].id;

    // 2. We'll send two concurrent requests, both trying to order 6 items. 6+6=12 > 10. One should fail.
    const req1 = request(app.getHttpServer())
      .post('/orders')
      .send({
        customerId: customerId1,
        items: [{ productId, quantity: 6 }],
      });

    const req2 = request(app.getHttpServer())
      .post('/orders')
      .send({
        customerId: customerId2,
        items: [{ productId, quantity: 6 }],
      });

    const [res1, res2] = await Promise.all([req1, req2]);

    // One should succeed (201), one should fail (409 Conflict)
    const statuses = [res1.status, res2.status];
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);

    // 3. Verify stock is exactly 4.
    const getRes = await request(app.getHttpServer()).get('/products?limit=100').expect(200);

    const product = getRes.body.data.find((p) => p.id === productId);
    expect(product.stock).toBe(4);
  });
});
