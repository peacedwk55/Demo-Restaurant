import { IsString, IsNumber, IsBoolean, IsOptional, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateOptionDto {
  @IsString() name!: string
  @IsOptional() @IsString() nameEn?: string
  @IsNumber() priceAdjust!: number
  @IsOptional() @IsBoolean() isDefault?: boolean
  @IsOptional() @IsNumber() sortOrder?: number
}

export class CreateOptionGroupDto {
  @IsString() name!: string
  @IsOptional() @IsString() nameEn?: string
  @IsEnum(['SINGLE', 'MULTIPLE']) type!: 'SINGLE' | 'MULTIPLE'
  @IsOptional() @IsBoolean() required?: boolean
  @IsOptional() @IsNumber() minSelect?: number
  @IsOptional() @IsNumber() maxSelect?: number
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOptionDto) options!: CreateOptionDto[]
}

export class CreateMenuItemDto {
  @IsString() categoryId!: string
  @IsString() name!: string
  @IsOptional() @IsString() nameEn?: string
  @IsOptional() @IsString() description?: string
  @IsNumber() @Min(0) price!: number
  @IsOptional() @IsString() imageUrl?: string
  @IsOptional() @IsBoolean() isAvailable?: boolean
  @IsOptional() @IsBoolean() isPopular?: boolean
  @IsOptional() @IsBoolean() isNew?: boolean
  @IsOptional() @IsNumber() preparationTime?: number
  @IsOptional() @IsNumber() calories?: number
  @IsOptional() @IsNumber() sortOrder?: number
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOptionGroupDto) optionGroups?: CreateOptionGroupDto[]
}

export class UpdateMenuItemDto {
  @IsOptional() @IsString() categoryId?: string
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() nameEn?: string
  @IsOptional() @IsString() description?: string
  @IsOptional() @IsNumber() @Min(0) price?: number
  @IsOptional() @IsString() imageUrl?: string
  @IsOptional() @IsBoolean() isAvailable?: boolean
  @IsOptional() @IsBoolean() isPopular?: boolean
  @IsOptional() @IsBoolean() isNew?: boolean
  @IsOptional() @IsNumber() preparationTime?: number
  @IsOptional() @IsNumber() calories?: number
  @IsOptional() @IsNumber() sortOrder?: number
}

export class CreateCategoryDto {
  @IsString() name!: string
  @IsOptional() @IsString() nameEn?: string
  @IsOptional() @IsString() icon?: string
  @IsOptional() @IsString() imageUrl?: string
  @IsOptional() @IsNumber() sortOrder?: number
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() name?: string
  @IsOptional() @IsString() nameEn?: string
  @IsOptional() @IsString() icon?: string
  @IsOptional() @IsString() imageUrl?: string
  @IsOptional() @IsNumber() sortOrder?: number
  @IsOptional() @IsBoolean() isActive?: boolean
}
