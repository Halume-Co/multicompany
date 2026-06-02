import { IsInt, IsUUID, Min, Max, IsNotEmpty } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(30)
  @Max(60)
  size: number;

  @IsInt()
  @Min(1)
  @Max(100)
  quantity: number;
}
