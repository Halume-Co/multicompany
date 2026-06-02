import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryProductDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
