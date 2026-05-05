import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { OrderStatus, ItemStatus } from '@tableflow/types'

export class CreateOrderItemOptionDto {
  @IsString() optionId!: string
  @IsString() name!: string
  @IsNumber() priceAdjust!: number
}

export class CreateOrderItemDto {
  @IsString() menuItemId!: string
  @IsNumber() @Min(1) quantity!: number
  @IsNumber() @Min(0) unitPrice!: number
  @IsOptional() @IsString() notes?: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemOptionDto) options!: CreateOrderItemOptionDto[]
}

export class CreateOrderDto {
  @IsString() tableId!: string
  @IsString() sessionCode!: string
  @IsArray() @ValidateNested({ each: true }) @Type(() => CreateOrderItemDto) items!: CreateOrderItemDto[]
  @IsOptional() @IsString() notes?: string
}

export class UpdateOrderStatusDto {
  @IsEnum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'])
  status!: OrderStatus
}

export class UpdateItemStatusDto {
  @IsEnum(['PENDING', 'PREPARING', 'DONE', 'CANCELLED'])
  status!: ItemStatus
}
