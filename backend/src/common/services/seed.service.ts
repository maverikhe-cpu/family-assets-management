import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssetCategory } from '../../assets/entities/asset-category.entity';
import { TransactionCategory } from '../../transactions/entities/transaction-category.entity';
import { User } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService {
  constructor(
    @InjectRepository(AssetCategory)
    private assetCategoriesRepository: Repository<AssetCategory>,
    @InjectRepository(TransactionCategory)
    private transactionCategoriesRepository: Repository<TransactionCategory>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async seed() {
    await this.seedUsers();
    await this.seedAssetCategories();
    await this.seedTransactionCategories();
  }

  async seedUsers() {
    const count = await this.usersRepository.count();
    if (count > 0) return;

    const hashedPassword = await bcrypt.hash('password123', 10);

    const users = [
      {
        id: 'user_owner',
        username: 'owner',
        password: hashedPassword,
        email: 'owner@example.com',
        name: '本人',
        role: 'owner',
        color: '#3B82F6',
        order: 1,
      },
      {
        id: 'user_spouse',
        username: 'spouse',
        password: hashedPassword,
        email: 'spouse@example.com',
        name: '配偶',
        role: 'spouse',
        color: '#EC4899',
        order: 2,
      },
      {
        id: 'user_child1',
        username: 'child1',
        password: hashedPassword,
        email: 'child1@example.com',
        name: '子女1',
        role: 'child',
        color: '#10B981',
        order: 3,
      },
    ];

    await this.usersRepository.save(users);
    console.log('✅ Default users seeded');
  }

  async seedAssetCategories() {
    const count = await this.assetCategoriesRepository.count();
    if (count > 0) return;

    // Create parent categories
    const parentCategories = [
      { name: '固定资产', parentId: null, icon: '🏠', color: '#8B5CF6', isBuiltin: true, order: 1 },
      { name: '流动资产', parentId: null, icon: '💰', color: '#10B981', isBuiltin: true, order: 2 },
      { name: '投资资产', parentId: null, icon: '📈', color: '#F59E0B', isBuiltin: true, order: 3 },
      { name: '负债', parentId: null, icon: '📉', color: '#EF4444', isBuiltin: true, order: 4 },
    ];

    const savedParents = await this.assetCategoriesRepository.save(parentCategories);
    const parentMap = new Map(savedParents.map(p => [p.name, p.id]));

    // Create child categories
    const childCategories = [
      // 固定资产
      { name: '房产', parentId: parentMap.get('固定资产')!, icon: '🏢', color: '#8B5CF6', isBuiltin: true, order: 1 },
      { name: '车辆', parentId: parentMap.get('固定资产')!, icon: '🚗', color: '#8B5CF6', isBuiltin: true, order: 2 },
      { name: '贵重物品', parentId: parentMap.get('固定资产')!, icon: '💎', color: '#8B5CF6', isBuiltin: true, order: 3 },
      // 流动资产
      { name: '现金', parentId: parentMap.get('流动资产')!, icon: '💵', color: '#10B981', isBuiltin: true, order: 1 },
      { name: '银行存款', parentId: parentMap.get('流动资产')!, icon: '🏦', color: '#10B981', isBuiltin: true, order: 2 },
      { name: '货币基金', parentId: parentMap.get('流动资产')!, icon: '🪙', color: '#10B981', isBuiltin: true, order: 3 },
      // 投资资产
      { name: '股票基金', parentId: parentMap.get('投资资产')!, icon: '📊', color: '#F59E0B', isBuiltin: true, order: 1 },
      { name: '保险', parentId: parentMap.get('投资资产')!, icon: '🛡️', color: '#F59E0B', isBuiltin: true, order: 2 },
      { name: '债券', parentId: parentMap.get('投资资产')!, icon: '📜', color: '#F59E0B', isBuiltin: true, order: 3 },
      { name: '数字货币', parentId: parentMap.get('投资资产')!, icon: '₿', color: '#F59E0B', isBuiltin: true, order: 4 },
      // 负债
      { name: '房贷', parentId: parentMap.get('负债')!, icon: '🏠', color: '#EF4444', isBuiltin: true, order: 1 },
      { name: '车贷', parentId: parentMap.get('负债')!, icon: '🚗', color: '#EF4444', isBuiltin: true, order: 2 },
      { name: '信用卡欠款', parentId: parentMap.get('负债')!, icon: '💳', color: '#EF4444', isBuiltin: true, order: 3 },
      { name: '其他借款', parentId: parentMap.get('负债')!, icon: '📝', color: '#EF4444', isBuiltin: true, order: 4 },
    ];

    await this.assetCategoriesRepository.save(childCategories);
    console.log('✅ Asset categories seeded');
  }

  async seedTransactionCategories() {
    const count = await this.transactionCategoriesRepository.count();
    if (count > 0) return;

    const incomeCategories = [
      { name: '工资', type: 'income', parentId: null, icon: '💼', color: '#10B981', isBuiltin: true, order: 1 },
      { name: '奖金', type: 'income', parentId: null, icon: '🎁', color: '#10B981', isBuiltin: true, order: 2 },
      { name: '投资收益', type: 'income', parentId: null, icon: '📈', color: '#10B981', isBuiltin: true, order: 3 },
      { name: '兼职收入', type: 'income', parentId: null, icon: '💰', color: '#10B981', isBuiltin: true, order: 4 },
      { name: '其他收入', type: 'income', parentId: null, icon: '📥', color: '#10B981', isBuiltin: true, order: 5 },
    ];

    const expenseCategories = [
      { name: '餐饮', type: 'expense', parentId: null, icon: '🍜', color: '#F59E0B', isBuiltin: true, order: 1 },
      { name: '交通', type: 'expense', parentId: null, icon: '🚗', color: '#F59E0B', isBuiltin: true, order: 2 },
      { name: '购物', type: 'expense', parentId: null, icon: '🛍️', color: '#F59E0B', isBuiltin: true, order: 3 },
      { name: '娱乐', type: 'expense', parentId: null, icon: '🎮', color: '#F59E0B', isBuiltin: true, order: 4 },
      { name: '医疗', type: 'expense', parentId: null, icon: '💊', color: '#F59E0B', isBuiltin: true, order: 5 },
      { name: '教育', type: 'expense', parentId: null, icon: '📚', color: '#F59E0B', isBuiltin: true, order: 6 },
      { name: '居住', type: 'expense', parentId: null, icon: '🏠', color: '#F59E0B', isBuiltin: true, order: 7 },
      { name: '通讯', type: 'expense', parentId: null, icon: '📱', color: '#F59E0B', isBuiltin: true, order: 8 },
      { name: '其他支出', type: 'expense', parentId: null, icon: '📤', color: '#F59E0B', isBuiltin: true, order: 9 },
    ];

    await this.transactionCategoriesRepository.save([...incomeCategories, ...expenseCategories]);
    console.log('✅ Transaction categories seeded');
  }
}
