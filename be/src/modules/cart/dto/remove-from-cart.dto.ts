import { IsInt, IsUUID, Min, Max, IsNotEmpty } from 'class-validator';

export class RemoveFromCartDto {
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(30)
  @Max(60)
  size: number;
}
