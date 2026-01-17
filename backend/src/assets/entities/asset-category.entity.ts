import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

@Entity('asset_categories')
export class AssetCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  parentId: string;

  @Column()
  icon: string;

  @Column()
  color: string;

  @Column({ default: false })
  isBuiltin: boolean;

  @Column()
  order: number;
}
