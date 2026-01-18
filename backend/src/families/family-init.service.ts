import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Family } from './entities/family.entity';
import { FamilyMember, FamilyMemberRole } from './entities/family-member.entity';
import { Asset } from '../assets/entities/asset.entity';
import { AssetCategory } from '../assets/entities/asset-category.entity';
import { Transaction } from '../transactions/entities/transaction.entity';
import { TransactionCategory } from '../transactions/entities/transaction-category.entity';
import { User } from '../users/entities/user.entity';
import * as crypto from 'crypto';

@Injectable()
export class FamilyInitService {
  private readonly logger = new Logger(FamilyInitService.name);

  constructor(
    @InjectRepository(Family)
    private familiesRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private familyMembersRepository: Repository<FamilyMember>,
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(AssetCategory)
    private assetCategoriesRepository: Repository<AssetCategory>,
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(TransactionCategory)
    private transactionCategoriesRepository: Repository<TransactionCategory>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  /**
   * 为用户创建默认家庭
   */
  async createDefaultFamilyForUser(user: User): Promise<Family> {
    // 检查用户是否已有家庭
    if (user.familyId) {
      const family = await this.familiesRepository.findOne({
        where: { id: user.familyId },
      });
      if (family) {
        this.logger.log(`User ${user.id} already has family ${family.id}`);
        return family;
      }
    }

    // 检查用户是否是任何家庭的成员
    const existingMembership = await this.familyMembersRepository.findOne({
      where: { userId: user.id },
    });

    if (existingMembership) {
      // 用户已经是某个家庭的成员，设置为当前家庭
      user.familyId = existingMembership.familyId;
      await this.usersRepository.save(user);

      const family = await this.familiesRepository.findOne({
        where: { id: existingMembership.familyId },
      });
      this.logger.log(`Set existing family ${family.id} for user ${user.id}`);
      return family!;
    }

    // 创建新家庭
    const family = this.familiesRepository.create({
      name: `${user.name}的家庭`,
      description: '默认家庭',
      createdBy: user.id,
      inviteCode: this.generateInviteCode(),
    });

    const savedFamily = await this.familiesRepository.save(family);

    // 创建者为家庭所有者
    const ownerMember = this.familyMembersRepository.create({
      familyId: savedFamily.id,
      userId: user.id,
      role: FamilyMemberRole.OWNER,
    });

    await this.familyMembersRepository.save(ownerMember);

    // 更新用户的当前家庭
    user.familyId = savedFamily.id;
    await this.usersRepository.save(user);

    // 初始化默认分类
    await this.initializeDefaultCategories(savedFamily.id);

    this.logger.log(`Created default family ${savedFamily.id} for user ${user.id}`);
    return savedFamily;
  }

  /**
   * 初始化默认的资产和交易分类
   */
  async initializeDefaultCategories(familyId: string): Promise<void> {
    // 检查是否已有分类
    const existingAssetCategories = await this.assetCategoriesRepository.count({
      where: { familyId },
    });

    if (existingAssetCategories === 0) {
      await this.createDefaultAssetCategories(familyId);
    }

    const existingTransactionCategories = await this.transactionCategoriesRepository.count({
      where: { familyId },
    });

    if (existingTransactionCategories === 0) {
      await this.createDefaultTransactionCategories(familyId);
    }
  }

  /**
   * 创建默认资产分类
   */
  private async createDefaultAssetCategories(familyId: string): Promise<void> {
    const now = new Date();

    // 一级分类
    const parentCategories = [
      { name: '固定资产', icon: '🏠', color: '#8B5CF6', order: 1 },
      { name: '流动资产', icon: '💰', color: '#10B981', order: 2 },
      { name: '投资资产', icon: '📈', color: '#F59E0B', order: 3 },
      { name: '负债', icon: '📉', color: '#EF4444', order: 4 },
    ];

    const savedParents = await this.assetCategoriesRepository.save(
      parentCategories.map((cat) => ({
        ...cat,
        familyId,
        parentId: null,
        isBuiltin: true,
        createdAt: now,
        updatedAt: now,
      })),
    );

    const parentMap = new Map(savedParents.map((p) => [p.name, p.id]));

    // 二级分类
    const childCategories = [
      // 固定资产
      { name: '房产', parentId: parentMap.get('固定资产')!, icon: '🏢', order: 1 },
      { name: '车辆', parentId: parentMap.get('固定资产')!, icon: '🚗', order: 2 },
      { name: '贵重物品', parentId: parentMap.get('固定资产')!, icon: '💎', order: 3 },
      // 流动资产
      { name: '现金', parentId: parentMap.get('流动资产')!, icon: '💵', order: 1 },
      { name: '银行存款', parentId: parentMap.get('流动资产')!, icon: '🏦', order: 2 },
      { name: '货币基金', parentId: parentMap.get('流动资产')!, icon: '🪙', order: 3 },
      // 投资资产
      { name: '股票基金', parentId: parentMap.get('投资资产')!, icon: '📊', order: 1 },
      { name: '保险', parentId: parentMap.get('投资资产')!, icon: '🛡️', order: 2 },
      { name: '债券', parentId: parentMap.get('投资资产')!, icon: '📜', order: 3 },
      { name: '数字货币', parentId: parentMap.get('投资资产')!, icon: '₿', order: 4 },
      // 负债
      { name: '房贷', parentId: parentMap.get('负债')!, icon: '🏠', order: 1 },
      { name: '车贷', parentId: parentMap.get('负债')!, icon: '🚗', order: 2 },
      { name: '信用卡欠款', parentId: parentMap.get('负债')!, icon: '💳', order: 3 },
      { name: '其他借款', parentId: parentMap.get('负债')!, icon: '📝', order: 4 },
    ];

    await this.assetCategoriesRepository.save(
      childCategories.map((cat) => ({
        ...cat,
        familyId,
        isBuiltin: true,
        createdAt: now,
        updatedAt: now,
      })),
    );

    this.logger.log(`Created default asset categories for family ${familyId}`);
  }

  /**
   * 创建默认交易分类
   */
  private async createDefaultTransactionCategories(familyId: string): Promise<void> {
    const now = new Date();

    const incomeCategories = [
      { name: '工资', icon: '💼', order: 1 },
      { name: '奖金', icon: '🎁', order: 2 },
      { name: '投资收益', icon: '📈', order: 3 },
      { name: '兼职收入', icon: '💰', order: 4 },
      { name: '其他收入', icon: '📥', order: 5 },
    ];

    const expenseCategories = [
      { name: '餐饮', icon: '🍜', order: 1 },
      { name: '交通', icon: '🚗', order: 2 },
      { name: '购物', icon: '🛍️', order: 3 },
      { name: '娱乐', icon: '🎮', order: 4 },
      { name: '医疗', icon: '💊', order: 5 },
      { name: '教育', icon: '📚', order: 6 },
      { name: '居住', icon: '🏠', order: 7 },
      { name: '通讯', icon: '📱', order: 8 },
      { name: '其他支出', icon: '📤', order: 9 },
    ];

    await this.transactionCategoriesRepository.save(
      incomeCategories.map((cat) => ({
        ...cat,
        familyId,
        type: 'income',
        parentId: null,
        isBuiltin: true,
        createdAt: now,
        updatedAt: now,
      })),
    );

    await this.transactionCategoriesRepository.save(
      expenseCategories.map((cat) => ({
        ...cat,
        familyId,
        type: 'expense',
        parentId: null,
        isBuiltin: true,
        createdAt: now,
        updatedAt: now,
      })),
    );

    this.logger.log(`Created default transaction categories for family ${familyId}`);
  }

  /**
   * 迁移用户的数据到其家庭
   */
  async migrateUserDataToFamily(userId: string): Promise<void> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // 确保用户有家庭
    const family = await this.createDefaultFamilyForUser(user);

    // 迁移资产数据（添加 familyId）
    await this.assetsRepository
      .createQueryBuilder()
      .update()
      .set({ familyId: family.id })
      .where('familyId IS NULL')
      .andWhere('holderId = :userId', { userId })
      .execute();

    // 迁移交易数据（添加 familyId）
    await this.transactionsRepository
      .createQueryBuilder()
      .update()
      .set({ familyId: family.id })
      .where('familyId IS NULL')
      .andWhere('memberId = :userId', { userId })
      .execute();

    this.logger.log(`Migrated data for user ${userId} to family ${family.id}`);
  }

  /**
   * 为所有没有家庭的用户创建默认家庭
   */
  async initializeAllUsers(): Promise<void> {
    const usersWithoutFamily = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.familyMemberships', 'membership')
      .where('membership.id IS NULL')
      .getMany();

    this.logger.log(`Found ${usersWithoutFamily.length} users without family`);

    for (const user of usersWithoutFamily) {
      try {
        await this.createDefaultFamilyForUser(user);
      } catch (error) {
        this.logger.error(`Failed to create family for user ${user.id}: ${error.message}`);
      }
    }
  }

  /**
   * 迁移所有未关联的家庭数据
   */
  async migrateAllOrphanData(): Promise<void> {
    // 迁移未关联的资产
    const orphanAssets = await this.assetsRepository
      .createQueryBuilder('asset')
      .leftJoin('asset.holder', 'holder')
      .where('asset.familyId IS NULL')
      .andWhere('holder.familyId IS NOT NULL')
      .getMany();

    for (const asset of orphanAssets) {
      const holder = await this.usersRepository.findOne({
        where: { id: asset.holderId },
      });

      if (holder?.familyId) {
        await this.assetsRepository.update(asset.id, { familyId: holder.familyId });
      }
    }

    // 迁移未关联的交易
    const orphanTransactions = await this.transactionsRepository
      .createQueryBuilder('transaction')
      .leftJoin('transaction.member', 'member')
      .where('transaction.familyId IS NULL')
      .andWhere('member.familyId IS NOT NULL')
      .getMany();

    for (const transaction of orphanTransactions) {
      const member = await this.usersRepository.findOne({
        where: { id: transaction.memberId },
      });

      if (member?.familyId) {
        await this.transactionsRepository.update(transaction.id, { familyId: member.familyId });
      }
    }

    this.logger.log(`Migrated ${orphanAssets.length} orphan assets and ${orphanTransactions.length} orphan transactions`);
  }

  /**
   * 生成邀请码
   */
  private generateInviteCode(): string {
    return crypto.randomBytes(6).toString('hex').toUpperCase();
  }
}
