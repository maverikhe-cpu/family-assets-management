import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { AssetCategory } from './entities/asset-category.entity';
import { AssetChange, AssetChangeType } from './entities/asset-change.entity';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetsRepository: Repository<Asset>,
    @InjectRepository(AssetCategory)
    private categoriesRepository: Repository<AssetCategory>,
    @InjectRepository(AssetChange)
    private changesRepository: Repository<AssetChange>,
  ) {}

  async create(createAssetDto: CreateAssetDto): Promise<Asset> {
    const asset = this.assetsRepository.create(createAssetDto);
    return this.assetsRepository.save(asset);
  }

  async findAll(userId?: string): Promise<Asset[]> {
    if (userId) {
      return this.assetsRepository.find({
        where: { holderId: userId },
        relations: ['holder'],
      });
    }
    return this.assetsRepository.find({ relations: ['holder'] });
  }

  async findOne(id: string): Promise<Asset> {
    const asset = await this.assetsRepository.findOne({
      where: { id },
      relations: ['holder', 'changes'],
    });
    if (!asset) {
      throw new NotFoundException(`Asset #${id} not found`);
    }
    return asset;
  }

  async update(id: string, updateAssetDto: UpdateAssetDto): Promise<Asset> {
    const asset = await this.findOne(id);
    const beforeValue = asset.currentValue;
    Object.assign(asset, updateAssetDto);

    const updated = await this.assetsRepository.save(asset);

    // 记录估值变动
    if ('currentValue' in updateAssetDto && updateAssetDto.currentValue !== undefined && updateAssetDto.currentValue !== beforeValue) {
      const profitLoss = updateAssetDto.currentValue - beforeValue;
      const profitLossRate = beforeValue > 0 ? (profitLoss / beforeValue) * 100 : 0;
      await this.changesRepository.save({
        assetId: id,
        type: AssetChangeType.VALUATION_ADJUST,
        amount: updateAssetDto.currentValue - beforeValue,
        beforeValue,
        afterValue: updateAssetDto.currentValue,
        profitLoss,
        profitLossRate,
        date: new Date(),
      });
    }

    return updated;
  }

  async remove(id: string): Promise<void> {
    const asset = await this.findOne(id);
    await this.assetsRepository.remove(asset);
  }

  // 资产分类
  async findCategories(): Promise<AssetCategory[]> {
    return this.categoriesRepository.find({ order: { order: 'ASC' } });
  }

  async createCategory(data: Partial<AssetCategory>): Promise<AssetCategory> {
    const category = this.categoriesRepository.create(data);
    return this.categoriesRepository.save(category);
  }

  // 资产变动
  async findChanges(assetId: string): Promise<AssetChange[]> {
    return this.changesRepository.find({
      where: { assetId },
      order: { date: 'DESC' },
    });
  }
}
