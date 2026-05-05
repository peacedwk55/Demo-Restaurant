import { Injectable, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from '../../prisma/prisma.service'
import { LoginDto, LoginPinDto } from './dto/login.dto'
import { JwtPayload, AuthResponseDto } from '@tableflow/types'
import * as bcrypt from 'bcryptjs'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } })
    if (!tenant || !tenant.isActive) throw new UnauthorizedException('Invalid credentials')

    const user = await this.prisma.user.findUnique({
      where: { tenantId_email: { tenantId: tenant.id, email: dto.email } },
    })
    if (!user || !user.isActive) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
      sub: user.id,
      tenantId: tenant.id,
      role: user.role,
    }

    return {
      token: this.jwtService.sign(payload),
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, logoUrl: tenant.logoUrl },
    }
  }

  async loginWithPin(dto: LoginPinDto): Promise<AuthResponseDto> {
    const tenant = await this.prisma.tenant.findUnique({ where: { slug: dto.tenantSlug } })
    if (!tenant || !tenant.isActive) throw new UnauthorizedException('Invalid credentials')

    const users = await this.prisma.user.findMany({
      where: { tenantId: tenant.id, isActive: true, pin: { not: null } },
    })

    for (const user of users) {
      if (user.pin && (await bcrypt.compare(dto.pin, user.pin))) {
        const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
          sub: user.id,
          tenantId: tenant.id,
          role: user.role,
        }
        return {
          token: this.jwtService.sign(payload),
          user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
          tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, logoUrl: tenant.logoUrl },
        }
      }
    }

    throw new UnauthorizedException('Invalid PIN')
  }

  async getMe(userId: string, tenantId: string): Promise<AuthResponseDto['user'] & { tenant: AuthResponseDto['tenant'] }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new NotFoundException('User not found')

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } })
    if (!tenant) throw new NotFoundException('Tenant not found')

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name, logoUrl: tenant.logoUrl },
    }
  }
}
