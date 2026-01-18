import { IsEnum } from 'class-validator';
import { FamilyMemberRole } from '../entities/family-member.entity';

export class UpdateMemberRoleDto {
  @IsEnum(FamilyMemberRole)
  role: FamilyMemberRole;
}
