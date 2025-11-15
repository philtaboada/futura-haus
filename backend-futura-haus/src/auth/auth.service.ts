import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async register(registerDto: RegisterDto) {
    console.log('email: ', registerDto.email);
    console.log('password: ', registerDto.password);
    const { email, password } = registerDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { email, passwordHash: hashedPassword }
    });

    const payload = { email: user.email };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    return { message: `User registered successfully ${user.email}`, token };
  }

  async login(loginDto: LoginDto) {
    console.log('email recibido: ', loginDto.email);
    console.log('password recibido: ', loginDto.password);
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({
      where: { email }
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });
    return { message: `User logged in successfully ${user.email}`, token };
  }

  me(user: any) {
    return { message: `User logged in successfully ${user.email}` };
  }
}
