import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AssetsModule } from './assets/assets.module';
import { TransactionsModule } from './transactions/transactions.module';
import { User } from './users/entities/user.entity';
import { Asset } from './assets/entities/asset.entity';
import { AssetCategory } from './assets/entities/asset-category.entity';
import { AssetChange } from './assets/entities/asset-change.entity';
import { Transaction } from './transactions/entities/transaction.entity';
import { TransactionCategory } from './transactions/entities/transaction-category.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'family_assets',
      entities: [
        User,
        Asset,
        AssetCategory,
        AssetChange,
        Transaction,
        TransactionCategory,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    AuthModule,
    UsersModule,
    AssetsModule,
    TransactionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
