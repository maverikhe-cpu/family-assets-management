import { IsNotEmpty, IsEnum, IsUUID } from 'class-validator';
import { FamilyMemberRole } from '../entities/family-member.entity';

export class AddMemberDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsEnum(FamilyMemberRole)
  role?: FamilyMemberRole;
}
