import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Asset } from '../../assets/entities/asset.entity';
import { Transaction } from '../../transactions/entities/transaction.entity';

export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  OWNER = 'owner',
  SPOUSE = 'spouse',
  CHILD = 'child',
  OTHER = 'other',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  username: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'simple-enum',
    enum: UserRole,
    default: UserRole.EDITOR,
  })
  role: UserRole;

  @Column({ nullable: true })
  familyId: string;

  @Column()
  color: string;

  @Column()
  order: number;

  @OneToMany(() => Asset, (asset) => asset.holder)
  assets: Asset[];

  @OneToMany(() => Transaction, (transaction) => transaction.member)
  transactions: Transaction[];
}
