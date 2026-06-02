import { IsInt, IsNotEmpty, IsPositive, IsString, Min, Max } from 'class-validator';

export class UpdateCartItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(30)
  @Max(60)
  size: number;

  @IsInt()
  @IsPositive()
  quantity: number;
}
