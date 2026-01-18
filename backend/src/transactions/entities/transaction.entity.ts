import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
  TRANSFER = 'transfer',
}

@Entity('transactions')
export class Transaction extends BaseEntity {
  @Column({
    type: 'enum',
    enum: TransactionType,
  })
  type: TransactionType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column()
  categoryId: string;

  @Column()
  accountId: string;

  @Column()
  familyId: string;

  @Column()
  memberId: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  notes: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ nullable: true })
  relatedAssetId: string;

  @ManyToOne(() => User, (user) => user.transactions)
  @JoinColumn({ name: 'memberId' })
  member: User;
}
