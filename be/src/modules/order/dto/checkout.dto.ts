import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CheckoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
