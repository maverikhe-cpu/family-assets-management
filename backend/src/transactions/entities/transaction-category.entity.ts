import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum CategoryType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

@Entity('transaction_categories')
export class TransactionCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CategoryType,
  })
  type: CategoryType;

  @Column()
  familyId: string;

  @Column({ nullable: true })
  parentId: string | null;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ default: false })
  isBuiltin: boolean;

  @Column()
  order: number;
}
