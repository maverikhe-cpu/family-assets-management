import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Asset } from './asset.entity';

export enum AssetChangeType {
  BUY = 'buy',
  SELL = 'sell',
  TRANSFER_IN = 'transfer_in',
  TRANSFER_OUT = 'transfer_out',
  VALUATION_ADJUST = 'valuation_adjust',
  DEPRECIATION = 'depreciation',
}

@Entity('asset_changes')
export class AssetChange extends BaseEntity {
  @Column()
  assetId: string;

  @Column({
    type: 'enum',
    enum: AssetChangeType,
  })
  type: AssetChangeType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  beforeValue: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  afterValue: number;

  @Column({ nullable: true })
  relatedTransactionId: string;

  @Column({ nullable: true })
  relatedAssetId: string;

  @Column()
  date: Date;

  @Column({ nullable: true })
  notes: string;

  @ManyToOne(() => Asset, (asset) => asset.changes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;
}
