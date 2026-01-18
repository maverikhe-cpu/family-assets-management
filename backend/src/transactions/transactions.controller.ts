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
  Query,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { FamilyGuard } from '../common/guards/family.guard';
import type { RequestWithUser } from '../types/request.types';

@Controller('transactions')
@UseGuards(JwtAuthGuard, FamilyGuard)
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  create(@Request() req: RequestWithUser, @Body() createTransactionDto: CreateTransactionDto) {
    return this.transactionsService.create({
      ...createTransactionDto,
      familyId: req.user.familyId,
    });
  }

  @Get()
  findAll(@Request() req: RequestWithUser) {
    return this.transactionsService.findAll(req.user.familyId);
  }

  @Get('statistics')
  getStatistics(@Request() req: RequestWithUser) {
    return this.transactionsService.getStatistics(req.user.familyId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    return this.transactionsService.update(id, updateTransactionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.transactionsService.remove(id);
  }

  @Get('categories/list')
  findCategories(@Request() req: RequestWithUser, @Query('type') type?: 'income' | 'expense') {
    return this.transactionsService.findCategories(req.user.familyId, type);
  }

  @Post('categories')
  createCategory(@Request() req: RequestWithUser, @Body() data: any) {
    return this.transactionsService.createCategory(req.user.familyId, data);
  }
}
