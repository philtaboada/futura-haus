import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus } from '../../generated/prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';

describe('OrdersService', () => {
  let service: OrdersService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    customer: {
      findUnique: jest.fn(),
    },
    product: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const mockCustomer = {
      id: 1,
      name: 'Cliente Test',
      email: 'cliente@test.com',
    };

    const mockProducts = [
      {
        id: 1,
        name: 'Producto 1',
        sku: 'PROD1',
        price: 100.0,
        stock: 10,
      },
      {
        id: 2,
        name: 'Producto 2',
        sku: 'PROD2',
        price: 50.0,
        stock: 5,
      },
    ];

    const createOrderDto: CreateOrderDto = {
      customerId: 1,
      items: [
        { productId: 1, qty: 2 },
        { productId: 2, qty: 3 },
      ],
    };

    it('debe calcular correctamente el total del pedido con múltiples productos', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue(mockProducts);

      const expectedTotal = 2 * 100.0 + 3 * 50.0; // 200 + 150 = 350

      const mockCreatedOrder = {
        id: 1,
        customerId: 1,
        status: OrderStatus.PENDING,
        total: expectedTotal,
        customer: mockCustomer,
        items: [
          {
            id: 1,
            productId: 1,
            qty: 2,
            price: 100.0,
            product: mockProducts[0],
          },
          {
            id: 2,
            productId: 2,
            qty: 3,
            price: 50.0,
            product: mockProducts[1],
          },
        ],
      };

      mockPrismaService.order.create.mockResolvedValue(mockCreatedOrder);

      const result = await service.create(createOrderDto);

      expect(result.total).toBe(expectedTotal);
      expect(mockPrismaService.order.create).toHaveBeenCalledWith({
        data: {
          customerId: 1,
          status: OrderStatus.PENDING,
          total: expectedTotal,
          items: {
            create: [
              { productId: 1, qty: 2, price: 100.0 },
              { productId: 2, qty: 3, price: 50.0 },
            ],
          },
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    it('debe calcular correctamente el total con un solo producto', async () => {
      const singleProductDto: CreateOrderDto = {
        customerId: 1,
        items: [{ productId: 1, qty: 5 }],
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue([mockProducts[0]]);

      const expectedTotal = 5 * 100.0; // 500

      const mockCreatedOrder = {
        id: 1,
        customerId: 1,
        status: OrderStatus.PENDING,
        total: expectedTotal,
        customer: mockCustomer,
        items: [
          {
            id: 1,
            productId: 1,
            qty: 5,
            price: 100.0,
            product: mockProducts[0],
          },
        ],
      };

      mockPrismaService.order.create.mockResolvedValue(mockCreatedOrder);

      const result = await service.create(singleProductDto);

      expect(result.total).toBe(expectedTotal);
    });

    it('debe lanzar NotFoundException si el cliente no existe', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Cliente con ID 1 no encontrado',
      );
    });

    it('debe lanzar NotFoundException si algún producto no existe', async () => {
      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue([mockProducts[0]]); // Solo devuelve un producto

      await expect(service.create(createOrderDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Uno o más productos no encontrados',
      );
    });

    it('debe validar stock suficiente antes de crear el pedido', async () => {
      const productsWithLowStock = [
        {
          id: 1,
          name: 'Producto 1',
          sku: 'PROD1',
          price: 100.0,
          stock: 1, // Stock insuficiente (se solicitan 2)
        },
      ];

      const orderWithInsufficientStock: CreateOrderDto = {
        customerId: 1,
        items: [{ productId: 1, qty: 2 }],
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue(
        productsWithLowStock,
      );

      await expect(
        service.create(orderWithInsufficientStock),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.create(orderWithInsufficientStock),
      ).rejects.toThrow('Stock insuficiente');
    });

    it('debe permitir crear pedido cuando el stock es exactamente igual a la cantidad solicitada', async () => {
      const productsWithExactStock = [
        {
          id: 1,
          name: 'Producto 1',
          sku: 'PROD1',
          price: 100.0,
          stock: 2, // Stock exacto
        },
      ];

      const orderWithExactStock: CreateOrderDto = {
        customerId: 1,
        items: [{ productId: 1, qty: 2 }],
      };

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue(
        productsWithExactStock,
      );

      const expectedTotal = 2 * 100.0;
      const mockCreatedOrder = {
        id: 1,
        customerId: 1,
        status: OrderStatus.PENDING,
        total: expectedTotal,
        customer: mockCustomer,
        items: [
          {
            id: 1,
            productId: 1,
            qty: 2,
            price: 100.0,
            product: productsWithExactStock[0],
          },
        ],
      };

      mockPrismaService.order.create.mockResolvedValue(mockCreatedOrder);

      const result = await service.create(orderWithExactStock);

      expect(result).toBeDefined();
      expect(result.total).toBe(expectedTotal);
    });

    it('debe validar stock para múltiples productos en el mismo pedido', async () => {
      const productsWithMixedStock = [
        {
          id: 1,
          name: 'Producto 1',
          sku: 'PROD1',
          price: 100.0,
          stock: 10, // Stock suficiente
        },
        {
          id: 2,
          name: 'Producto 2',
          sku: 'PROD2',
          price: 50.0,
          stock: 2, // Stock insuficiente (se solicitan 3)
        },
      ];

      mockPrismaService.customer.findUnique.mockResolvedValue(mockCustomer);
      mockPrismaService.product.findMany.mockResolvedValue(
        productsWithMixedStock,
      );

      await expect(service.create(createOrderDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createOrderDto)).rejects.toThrow(
        'Stock insuficiente para el producto Producto 2',
      );
    });
  });

  describe('confirm', () => {
    const mockOrder = {
      id: 1,
      customerId: 1,
      status: OrderStatus.PENDING,
      total: 350.0,
      customer: {
        id: 1,
        name: 'Cliente Test',
        email: 'cliente@test.com',
      },
      items: [
        {
          id: 1,
          productId: 1,
          qty: 2,
          price: 100.0,
          product: {
            id: 1,
            name: 'Producto 1',
            sku: 'PROD1',
            price: 100.0,
            stock: 10,
          },
        },
        {
          id: 2,
          productId: 2,
          qty: 3,
          price: 50.0,
          product: {
            id: 2,
            name: 'Producto 2',
            sku: 'PROD2',
            price: 50.0,
            stock: 5,
          },
        },
      ],
    };

    it('debe confirmar el pedido y descontar stock correctamente', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const mockTransaction = {
        product: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        order: {
          update: jest.fn(),
        },
      };

      mockTransaction.product.findUnique
        .mockResolvedValueOnce(mockOrder.items[0].product)
        .mockResolvedValueOnce(mockOrder.items[1].product);

      mockTransaction.product.update.mockResolvedValue({});

      const confirmedOrder = {
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      };
      mockTransaction.order.update.mockResolvedValue(confirmedOrder);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      const result = await service.confirm(1);

      expect(result.status).toBe(OrderStatus.CONFIRMED);
      expect(mockTransaction.product.findUnique).toHaveBeenCalledTimes(2);
      expect(mockTransaction.product.update).toHaveBeenCalledTimes(2);
      expect(mockTransaction.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { stock: { decrement: 2 } },
      });
      expect(mockTransaction.product.update).toHaveBeenCalledWith({
        where: { id: 2 },
        data: { stock: { decrement: 3 } },
      });
    });

    it('debe lanzar BadRequestException si el pedido ya está confirmado', async () => {
      const confirmedOrder = {
        ...mockOrder,
        status: OrderStatus.CONFIRMED,
      };

      mockPrismaService.order.findUnique.mockResolvedValue(confirmedOrder);

      await expect(service.confirm(1)).rejects.toThrow(BadRequestException);
      await expect(service.confirm(1)).rejects.toThrow(
        'El pedido ya está confirmado',
      );
    });

    it('debe validar stock antes de confirmar el pedido', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const productWithInsufficientStock = {
        ...mockOrder.items[0].product,
        stock: 1, // Stock insuficiente
      };

      const mockTransaction = {
        product: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        order: {
          update: jest.fn(),
        },
      };

      mockTransaction.product.findUnique.mockResolvedValue(
        productWithInsufficientStock,
      );

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      await expect(service.confirm(1)).rejects.toThrow(BadRequestException);
      await expect(service.confirm(1)).rejects.toThrow('Stock insuficiente');
    });

    it('debe lanzar NotFoundException si un producto no existe al confirmar', async () => {
      mockPrismaService.order.findUnique.mockResolvedValue(mockOrder);

      const mockTransaction = {
        product: {
          findUnique: jest.fn(),
          update: jest.fn(),
        },
        order: {
          update: jest.fn(),
        },
      };

      mockTransaction.product.findUnique.mockResolvedValue(null);

      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTransaction);
      });

      await expect(service.confirm(1)).rejects.toThrow(NotFoundException);
      await expect(service.confirm(1)).rejects.toThrow(
        'Producto con ID 1 no encontrado',
      );
    });
  });
});
