import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetsService } from './assets.service';
import { AssetsController } from './assets.controller';
import { Asset } from './entities/asset.entity';
import { AssetCategory } from './entities/asset-category.entity';
import { AssetChange } from './entities/asset-change.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      AssetCategory,
      AssetChange,
    ]),
  ],
  controllers: [AssetsController],
  providers: [AssetsService],
  exports: [AssetsService],
})
export class AssetsModule {}
