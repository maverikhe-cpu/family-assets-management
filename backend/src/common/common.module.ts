import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './services/seed.service';
import { SeedCommand } from './commands/seed.command';
import { AssetCategory } from '../assets/entities/asset-category.entity';
import { TransactionCategory } from '../transactions/entities/transaction-category.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AssetCategory,
      TransactionCategory,
      User,
    ]),
  ],
  providers: [SeedService, SeedCommand],
  exports: [SeedService],
})
export class CommonModule {}
