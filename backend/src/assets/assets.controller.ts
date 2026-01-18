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

  @Post()
  create(@Request() req: RequestWithUser, @Body() createAssetDto: CreateAssetDto) {
    return this.assetsService.create({
      ...createAssetDto,
      familyId: req.user.familyId,
    });
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.assetsService.findAll(req.user.familyId);
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
    return this.assetsService.findCategories(req.user.familyId);
  }

  @Post('categories')
  createCategory(@Request() req: RequestWithUser, @Body() data: any) {
    return this.assetsService.createCategory(req.user.familyId, data);
  }

  @Get(':id/changes')
  findChanges(@Param('id') id: string) {
    return this.assetsService.findChanges(id);
  }
}
