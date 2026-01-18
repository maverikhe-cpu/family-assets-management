import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { AssetsService } from './assets.service';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FamilyGuard } from '../common/guards/family.guard';
import type { RequestWithUser } from '../types/request.types';

@Controller('assets')
@UseGuards(JwtAuthGuard, FamilyGuard)
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}

  private getFamilyId(req: RequestWithUser): string {
    if (!req.user.familyId) {
      throw new BadRequestException('用户尚未加入家庭');
    }
    return req.user.familyId;
  }

  @Post()
  create(@Request() req: RequestWithUser, @Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create({
      ...createAssetDto,
      familyId: this.getFamilyId(req),
    });
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.assetsService.findAll(this.getFamilyId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.assetsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAssetDto: UpdateAssetDto) {
    return this.assetsService.update(id, updateAssetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assetsService.remove(id);
  }

  @Get('categories/list')
  findCategories(@Request() req: RequestWithUser) {
    return this.assetsService.findCategories(this.getFamilyId(req));
  }

  @Post('categories')
  createCategory(@Request() req: RequestWithUser, @Body() data: any) {
    return this.assetsService.createCategory(this.getFamilyId(req), data);
  }

  @Get(':id/changes')
  findChanges(@Param('id') id: string) {
    return this.assetsService.findChanges(id);
  }
}
