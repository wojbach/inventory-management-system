import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('InventoryController (integration)', () => {
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

  let createdProductId: string;

  it('/products (POST) - should create a product', async () => {
    const res = await request(app.getHttpServer())
      .post('/products')
      .send({
        name: 'Test Setup Product',
        description: 'Testing 123',
        price: 99.99,
        stock: 10,
        category: 'Electronics',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    createdProductId = res.body.id;
  });

  it('/products/:id/restock (POST) - should restock a product', async () => {
    await request(app.getHttpServer()).post(`/products/${createdProductId}/restock`).send({ amount: 5 }).expect(200);
  });

  it('/products (GET) - should return products list with updated stock', async () => {
    const res = await request(app.getHttpServer()).get('/products?limit=100').expect(200);

    expect(Array.isArray(res.body.data)).toBeTruthy();
    const product = res.body.data.find((p) => p.id === createdProductId);
    expect(product).toBeDefined();
    expect(product.stock).toBe(15);
  });
});
