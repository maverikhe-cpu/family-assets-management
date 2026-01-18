import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './services/seed.service';
import { SeedCommand } from './commands/seed.command';
import { MigrateCommand } from './commands/migrate.command';
import { AssetCategory } from '../assets/entities/asset-category.entity';
import { TransactionCategory } from '../transactions/entities/transaction-category.entity';
import { User } from '../users/entities/user.entity';
import { Asset } from '../assets/entities/asset.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { FamiliesModule } from '../families/families.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetCategory,
      TransactionCategory,
      User,
      Asset,
      Transaction,
    ]),
    forwardRef(() => FamiliesModule),
  ],
  providers: [SeedService, SeedCommand, MigrateCommand],
  exports: [SeedService],
})
export class CommonModule {}
