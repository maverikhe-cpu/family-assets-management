import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from './entities/asset.entity';
import { AssetCategory } from './entities/asset-category.entity';
import { AssetChange } from './entities/asset-change.entity';
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
    const asset = this.assetsRepository.create({
      ...createAssetDto,
      familyId: createAssetDto.familyId,
    });
    return this.assetsRepository.save(asset);
  }

  async findAll(familyId: string): Promise<Asset[]> {
    return this.assetsRepository.find({
      where: { familyId },
      relations: ['holder'],
      order: { createdAt: 'DESC' },
    });
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
    if (updateAssetDto.currentValue !== undefined && updateAssetDto.currentValue !== beforeValue) {
      await this.changesRepository.save({
        assetId: id,
        type: 'valuation_adjust',
        amount: updateAssetDto.currentValue - beforeValue,
        beforeValue,
        afterValue: updateAssetDto.currentValue,
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
  async findCategories(familyId: string): Promise<AssetCategory[]> {
    return this.categoriesRepository.find({
      where: { familyId },
      order: { order: 'ASC' },
    });
  }

  async createCategory(familyId: string, data: Partial<AssetCategory>): Promise<AssetCategory> {
    const category = this.categoriesRepository.create({
      ...data,
      familyId,
    });
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
