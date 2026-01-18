import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from './entities/transaction.entity';
import { TransactionCategory, CategoryType } from './entities/transaction-category.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(TransactionCategory)
    private categoriesRepository: Repository<TransactionCategory>,
  ) {}

  async create(createTransactionDto: CreateTransactionDto): Promise<Transaction> {
    const transaction = this.transactionsRepository.create({
      ...createTransactionDto,
      familyId: createTransactionDto.familyId,
    });
    return this.transactionsRepository.save(transaction);
  }

  async findAll(familyId: string): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { familyId },
      relations: ['member'],
      order: { date: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['member'],
    });
    if (!transaction) {
      throw new NotFoundException(`Transaction #${id} not found`);
    }
    return transaction;
  }

  async update(id: string, updateTransactionDto: UpdateTransactionDto): Promise<Transaction> {
    const transaction = await this.findOne(id);
    Object.assign(transaction, updateTransactionDto);
    return this.transactionsRepository.save(transaction);
  }

  async remove(id: string): Promise<void> {
    const transaction = await this.findOne(id);
    await this.transactionsRepository.remove(transaction);
  }

  // 交易分类
  async findCategories(familyId: string, type?: 'income' | 'expense'): Promise<TransactionCategory[]> {
    const where: any = { familyId };
    if (type) {
      where.type = type as CategoryType;
    }
    return this.categoriesRepository.find({
      where,
      order: { order: 'ASC' },
    });
  }

  async createCategory(familyId: string, data: Partial<TransactionCategory>): Promise<TransactionCategory> {
    const category = this.categoriesRepository.create({
      ...data,
      familyId,
    });
    return this.categoriesRepository.save(category);
  }

  // 统计
  async getStatistics(familyId: string) {
    const transactions = await this.findAll(familyId);

    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      totalIncome: income,
      totalExpense: expense,
      netIncome: income - expense,
      transactionCount: transactions.length,
    };
  }
}
