import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { AssetChange } from './asset-change.entity';

export enum AssetStatus {
  ACTIVE = 'active',
  DISPOSED = 'disposed',
  PENDING = 'pending',
}

@Entity('assets')
export class Asset extends BaseEntity {
  @Column()
  name: string;

  @Column()
  categoryId: string;

  @Column()
  holderId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  initialValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  currentValue: number;

  @Column({ default: 'CNY' })
  currency: string;

  @Column()
  purchaseDate: Date;

  @Column({
    type: 'simple-enum',
    enum: AssetStatus,
    default: AssetStatus.ACTIVE,
  })
  status: AssetStatus;

  @Column({ type: 'json', nullable: true })
  attributes: Record<string, any>;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => User, (user) => user.assets)
  @JoinColumn({ name: 'holderId' })
  holder: User;

  @OneToMany(() => AssetChange, (change) => change.asset)
  changes: AssetChange[];
}
