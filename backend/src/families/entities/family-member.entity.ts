import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Family } from './family.entity';
import { User } from '../../users/entities/user.entity';

export enum FamilyMemberRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

@Entity('family_members')
export class FamilyMember extends BaseEntity {
  @Column({ type: 'uuid' })
  familyId: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({
    type: 'enum',
    enum: FamilyMemberRole,
    default: FamilyMemberRole.MEMBER,
  })
  role: FamilyMemberRole;

  @Column({ nullable: true })
  invitedBy: string;

  @ManyToOne(() => Family, (family) => family.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'familyId' })
  family: Family;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
