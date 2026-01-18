import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamiliesService } from './families.service';
import { FamilyInitService } from './family-init.service';
import { FamiliesController } from './families.controller';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { User } from '../users/entities/user.entity';
import { Asset } from '../assets/entities/asset.entity';
import { AssetCategory } from '../assets/entities/asset-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionCategory } from '../transactions/entities/transaction-category.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Family,
      FamilyMember,
      User,
      Asset,
      AssetCategory,
      Transaction,
      TransactionCategory,
    ]),
  ],
  controllers: [FamiliesController],
  providers: [FamiliesService, FamilyInitService],
  exports: [FamiliesService, FamilyInitService],
})
export class FamiliesModule {}
