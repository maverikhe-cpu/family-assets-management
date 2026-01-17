import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';
import { TransactionType } from '../entities/transaction.entity';

export class CreateTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType;

  @IsNumber()
  amount: number;

  @IsString()
  categoryId: string;

  @IsString()
  accountId: string;

  @IsString()
  memberId: string;

  date: Date;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  relatedAssetId?: string;
}
