import { Entity, Column, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { FamilyMember } from './family-member.entity';

@Entity('families')
export class Family extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  createdBy: string;

  @Column({ nullable: true })
  inviteCode: string;

  @OneToMany(() => FamilyMember, (member) => member.family, { cascade: true })
  members: FamilyMember[];
}
