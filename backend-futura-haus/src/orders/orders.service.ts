import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '../../generated/prisma/client';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(createOrderDto: CreateOrderDto) {
    // Verificar que el cliente existe
    const customer = await this.prisma.customer.findUnique({
      where: { id: createOrderDto.customerId }
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${createOrderDto.customerId} no encontrado`);
    }

    // Verificar que todos los productos existen y tienen stock suficiente
    const productIds = createOrderDto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      throw new NotFoundException('Uno o más productos no encontrados');
    }

    // Validar stock suficiente para cada producto
    for (const item of createOrderDto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
      }
      if (product.stock < item.qty) {
        throw new BadRequestException(
          `Stock insuficiente para el producto ${product.name}. Stock disponible: ${product.stock}, solicitado: ${item.qty}`
        );
      }
    }

    // Calcular el total del pedido
    let total = 0;
    const orderItems = createOrderDto.items.map((item) => {
      const product = products.find((p) => p.id === item.productId)!;
      const itemTotal = Number(product.price) * item.qty;
      total += itemTotal;

      return {
        productId: item.productId,
        qty: item.qty,
        price: product.price
      };
    });

    // Crear el pedido con estado PENDING (no se descuenta stock aún)
    return this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,
        status: OrderStatus.PENDING,
        total: total,
        items: {
          create: orderItems
        }
      },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async findAll() {
    return this.prisma.order.findMany({
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException(`Pedido con ID ${id} no encontrado`);
    }

    return order;
  }

  async confirm(id: number) {
    // Obtener el pedido con sus items
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('El pedido ya está confirmado');
    }

    // Usar transacción para descontar stock y confirmar el pedido
    return this.prisma.$transaction(async (transaction) => {
      // Verificar stock nuevamente antes de confirmar (por si cambió desde la creación)
      for (const item of order.items) {
        if (!item.productId) {
          throw new NotFoundException(`El item del pedido no tiene un producto asociado`);
        }

        const product = await transaction.product.findUnique({
          where: { id: item.productId }
        });

        if (!product) {
          throw new NotFoundException(`Producto con ID ${item.productId} no encontrado`);
        }

        if (product.stock < item.qty) {
          throw new BadRequestException(
            `Stock insuficiente para el producto ${product.name}. Stock disponible: ${product.stock}, solicitado: ${item.qty}`
          );
        }

        // Descontar stock
        await transaction.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.qty
            }
          }
        });
      }

      // Confirmar el pedido
      return transaction.order.update({
        where: { id },
        data: {
          status: OrderStatus.CONFIRMED
        },
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
    });
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    await this.findOne(id);

    // Solo permitir actualizar pedidos pendientes
    const order = await this.prisma.order.findUnique({
      where: { id }
    });

    if (order?.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('No se puede actualizar un pedido confirmado');
    }

    return this.prisma.order.update({
      where: { id },
      data: updateOrderDto as any,
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  }

  async remove(id: number) {
    const order = await this.findOne(id);

    // Solo permitir eliminar pedidos pendientes
    if (order.status === OrderStatus.CONFIRMED) {
      throw new BadRequestException('No se puede eliminar un pedido confirmado');
    }

    return this.prisma.order.delete({
      where: { id }
    });
  }
}
