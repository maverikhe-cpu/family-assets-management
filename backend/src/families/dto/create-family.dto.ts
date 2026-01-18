import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFamilyDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}
