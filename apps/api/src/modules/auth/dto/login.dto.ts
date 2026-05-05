import { IsEmail, IsString, MinLength, IsOptional, Length } from 'class-validator'

export class LoginDto {
  @IsString()
  tenantSlug!: string

  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string
}

export class LoginPinDto {
  @IsString()
  tenantSlug!: string

  @IsString()
  @Length(4, 6)
  pin!: string
}

export class RefreshTokenDto {
  @IsString()
  token!: string
}
