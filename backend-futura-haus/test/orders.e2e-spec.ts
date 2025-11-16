/**
 * Tests de integración e2e para Orders
 * 
 * REQUISITOS:
 * - Base de datos PostgreSQL debe estar corriendo y accesible
 * - Variable de entorno DATABASE_URL debe estar configurada
 * - Ejecutar migraciones antes de correr los tests: pnpm prisma migrate deploy
 * 
 * Para ejecutar estos tests:
 * 1. Asegúrate de que PostgreSQL esté corriendo (puedes usar docker-compose up postgres)
 * 2. Configura DATABASE_URL en un archivo .env o como variable de entorno
 * 3. Ejecuta las migraciones: pnpm prisma migrate deploy
 * 4. Ejecuta los tests: pnpm test:e2e orders.e2e-spec.ts
 */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { OrderStatus } from '../generated/prisma/client';

describe('Orders (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;
  let authToken: string;
  let customerId: number;
  let product1Id: number;
  let product2Id: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();

    // Limpiar datos de prueba anteriores
    await prismaService.orderItem.deleteMany({});
    await prismaService.order.deleteMany({});
    await prismaService.product.deleteMany({});
    await prismaService.customer.deleteMany({});
    await prismaService.user.deleteMany({});

    // Crear usuario y obtener token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    authToken = registerResponse.body.token;

    // Crear cliente de prueba
    const customerResponse = await request(app.getHttpServer())
      .post('/api/customers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Cliente Test E2E',
        email: 'cliente.test@example.com',
      });

    customerId = customerResponse.body.id;

    // Crear productos de prueba
    const product1Response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Producto Test 1',
        sku: 'TEST-PROD-1',
        price: 100.0,
        stock: 10,
      });

    product1Id = product1Response.body.id;

    const product2Response = await request(app.getHttpServer())
      .post('/api/products')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Producto Test 2',
        sku: 'TEST-PROD-2',
        price: 50.0,
        stock: 5,
      });

    product2Id = product2Response.body.id;
  });

  afterAll(async () => {
    // Limpiar datos de prueba
    await prismaService.orderItem.deleteMany({});
    await prismaService.order.deleteMany({});
    await prismaService.product.deleteMany({});
    await prismaService.customer.deleteMany({});
    await prismaService.user.deleteMany({});

    await app.close();
  });

  describe('POST /api/orders - Creación de pedido', () => {
    it('debe crear un pedido correctamente con múltiples productos', async () => {
      const createOrderDto = {
        customerId,
        items: [
          { productId: product1Id, qty: 2 },
          { productId: product2Id, qty: 3 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.customerId).toBe(customerId);
      expect(response.body.status).toBe(OrderStatus.PENDING);
      expect(response.body.total).toBe('350.00'); // 2 * 100 + 3 * 50 = 350
      expect(response.body.items).toHaveLength(2);
      expect(response.body.items[0].qty).toBe(2);
      expect(response.body.items[0].price).toBe('100.00');
      expect(response.body.items[1].qty).toBe(3);
      expect(response.body.items[1].price).toBe('50.00');
    });

    it('debe calcular correctamente el total con un solo producto', async () => {
      const createOrderDto = {
        customerId,
        items: [{ productId: product1Id, qty: 5 }],
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(201);

      expect(response.body.total).toBe('500.00'); // 5 * 100 = 500
      expect(response.body.items).toHaveLength(1);
    });

    it('debe rechazar pedido con stock insuficiente', async () => {
      const createOrderDto = {
        customerId,
        items: [{ productId: product1Id, qty: 100 }], // Stock insuficiente (solo hay 10)
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(400);

      expect(response.body.message).toContain('Stock insuficiente');
    });

    it('debe rechazar pedido si el cliente no existe', async () => {
      const createOrderDto = {
        customerId: 99999,
        items: [{ productId: product1Id, qty: 1 }],
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(404);
    });

    it('debe rechazar pedido si el producto no existe', async () => {
      const createOrderDto = {
        customerId,
        items: [{ productId: 99999, qty: 1 }],
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto)
        .expect(404);
    });

    it('debe requerir autenticación para crear pedido', async () => {
      const createOrderDto = {
        customerId,
        items: [{ productId: product1Id, qty: 1 }],
      };

      await request(app.getHttpServer())
        .post('/api/orders')
        .send(createOrderDto)
        .expect(401);
    });
  });

  describe('POST /api/orders/:id/confirm - Confirmación de pedido', () => {
    let orderId: number;

    beforeEach(async () => {
      // Crear un pedido pendiente antes de cada test de confirmación
      const createOrderDto = {
        customerId,
        items: [
          { productId: product1Id, qty: 2 },
          { productId: product2Id, qty: 1 },
        ],
      };

      const response = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto);

      orderId = response.body.id;
    });

    it('debe confirmar un pedido y descontar stock correctamente', async () => {
      // Obtener stock inicial de los productos
      const product1Before = await prismaService.product.findUnique({
        where: { id: product1Id },
      });
      const product2Before = await prismaService.product.findUnique({
        where: { id: product2Id },
      });

      const stock1Before = product1Before!.stock;
      const stock2Before = product2Before!.stock;

      // Confirmar el pedido
      const response = await request(app.getHttpServer())
        .post(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.status).toBe(OrderStatus.CONFIRMED);

      // Verificar que el stock se descontó correctamente
      const product1After = await prismaService.product.findUnique({
        where: { id: product1Id },
      });
      const product2After = await prismaService.product.findUnique({
        where: { id: product2Id },
      });

      expect(product1After!.stock).toBe(stock1Before - 2);
      expect(product2After!.stock).toBe(stock2Before - 1);
    });

    it('debe rechazar confirmar un pedido ya confirmado', async () => {
      // Confirmar el pedido por primera vez
      await request(app.getHttpServer())
        .post(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Intentar confirmar nuevamente
      const response = await request(app.getHttpServer())
        .post(`/api/orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('ya está confirmado');
    });

    it('debe rechazar confirmar pedido con stock insuficiente', async () => {
      // Crear un pedido que consuma todo el stock disponible
      const createOrderDto = {
        customerId,
        items: [{ productId: product1Id, qty: 5 }], // Usar parte del stock
      };

      const orderResponse = await request(app.getHttpServer())
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send(createOrderDto);

      const newOrderId = orderResponse.body.id;

      // Consumir el stock restante directamente en la base de datos
      await prismaService.product.update({
        where: { id: product1Id },
        data: { stock: 0 },
      });

      // Intentar confirmar el pedido (debe fallar por stock insuficiente)
      const response = await request(app.getHttpServer())
        .post(`/api/orders/${newOrderId}/confirm`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.message).toContain('Stock insuficiente');
    });

    it('debe requerir autenticación para confirmar pedido', async () => {
      await request(app.getHttpServer())
        .post(`/api/orders/${orderId}/confirm`)
        .expect(401);
    });

    it('debe rechazar confirmar pedido que no existe', async () => {
      await request(app.getHttpServer())
        .post('/api/orders/99999/confirm')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});

