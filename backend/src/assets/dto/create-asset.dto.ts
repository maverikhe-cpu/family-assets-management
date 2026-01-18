import { IsString, IsNumber, IsEnum, IsOptional, IsObject, IsUUID } from 'class-validator';
import { AssetStatus } from '../entities/asset.entity';

export class CreateAssetDto {
  @IsString()
  name: string;

  @IsString()
  categoryId: string;

  @IsUUID()
  @IsOptional()
  familyId?: string;

  @IsString()
  holderId: string;

  @IsNumber()
  initialValue: number;

  @IsNumber()
  currentValue: number;

  @IsString()
  @IsOptional()
  currency?: string;

  purchaseDate: Date;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, any>;

  @IsString()
  @IsOptional()
  notes?: string;
}
