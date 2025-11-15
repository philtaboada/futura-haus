import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    console.log('createCustomerDto: ', createCustomerDto);
    const existingCustomer = await this.prisma.customer.findUnique({
      where: { email: createCustomerDto.email }
    });

    if (existingCustomer) {
      throw new ConflictException(`El email ${createCustomerDto.email} ya existe`);
    }

    return this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        email: createCustomerDto.email
      }
    });
  }

  async findAll() {
    return this.prisma.customer.findMany({
      orderBy: { id: 'asc' }
    });
  }

  async findOne(id: number) {
    console.log('id: ', id);
    const customer = await this.prisma.customer.findUnique({
      where: { id }
    });

    if (!customer) {
      throw new NotFoundException(`Cliente con ID ${id} no encontrado`);
    }

    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    // Verificar que el cliente existe
    await this.findOne(id);

    // Si se actualiza el email, validar que sea único
    if (updateCustomerDto.email) {
      const existingCustomer = await this.prisma.customer.findUnique({
        where: { email: updateCustomerDto.email }
      });

      if (existingCustomer && existingCustomer.id !== id) {
        throw new ConflictException(`El email ${updateCustomerDto.email} ya existe`);
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto as any
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.customer.delete({
      where: { id }
    });
  }
}
