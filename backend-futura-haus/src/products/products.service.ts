import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto) {
    // Validar SKU único
    const existingProduct = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku }
    });

    if (existingProduct) {
      throw new ConflictException(`El SKU ${createProductDto.sku} ya existe`);
    }

    // Validar precio no negativo
    if (createProductDto.price < 0) {
      throw new BadRequestException('El precio no puede ser negativo');
    }

    // Validar stock no negativo
    if (createProductDto.stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    return this.prisma.product.create({
      data: {
        name: createProductDto.name,
        sku: createProductDto.sku,
        price: createProductDto.price,
        stock: createProductDto.stock
      }
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { id: 'asc' }
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id }
    });

    if (!product) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    // Verificar que el producto existe
    await this.findOne(id);

    // Si se actualiza el SKU, validar que sea único
    if (updateProductDto.sku) {
      const existingProduct = await this.prisma.product.findUnique({
        where: { sku: updateProductDto.sku }
      });

      if (existingProduct && existingProduct.id !== id) {
        throw new ConflictException(`El SKU ${updateProductDto.sku} ya existe`);
      }
    }

    // Validar precio no negativo si se actualiza
    if (updateProductDto.price !== undefined && updateProductDto.price < 0) {
      throw new BadRequestException('El precio no puede ser negativo');
    }

    // Validar stock no negativo si se actualiza
    if (updateProductDto.stock !== undefined && updateProductDto.stock < 0) {
      throw new BadRequestException('El stock no puede ser negativo');
    }

    return this.prisma.product.update({
      where: { id },
      data: updateProductDto
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    // Eliminar el producto. Los order_items mantendrán su información histórica
    // (precio y cantidad) pero la referencia al producto se establecerá como null
    return this.prisma.product.delete({
      where: { id }
    });
  }
}
