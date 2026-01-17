import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { AssetCategory } from '../src/assets/entities/asset-category.entity';
import { TransactionCategory } from '../src/transactions/entities/transaction-category.entity';
import { Asset } from '../src/assets/entities/asset.entity';
import { Transaction } from '../src/transactions/entities/transaction.entity';
import { JwtService } from '@nestjs/jwt';

describe('API E2E Tests', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;

  // Test data constants
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Test123456',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    dataSource = app.get(DataSource);
    jwtService = app.get(JwtService);

    // Clean database and create fresh test data
    await cleanDatabase();
    await setupTestData();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  async function cleanDatabase() {
    await dataSource.getRepository(Transaction).delete({});
    await dataSource.getRepository(Asset).delete({});
    await dataSource.getRepository(TransactionCategory).delete({});
    await dataSource.getRepository(AssetCategory).delete({});
    await dataSource.getRepository(User).delete({});
  }

  async function setupTestData() {
    // Create test user
    const userRepo = dataSource.getRepository(User);
    const user = userRepo.create({
      ...testUser,
      id: 'test-user-id',
    });
    await userRepo.save(user);
    testUserId = user.id;

    // Generate auth token
    authToken = jwtService.sign({
      userId: user.id,
      username: user.username,
      role: user.role,
    });
  }

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          username: 'newuser',
          email: 'newuser@example.com',
          password: 'NewPass123',
        })
        .expect(201);

      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('user');
      expect(response.data.user.username).toBe('newuser');
    });

    it('should login with valid credentials', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(201);

      expect(response.data).toHaveProperty('access_token');
      expect(response.data).toHaveProperty('user');
    });

    it('should fail login with invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should get current user profile', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.data.username).toBe(testUser.username);
      expect(response.data.email).toBe(testUser.email);
    });

    it('should fail without auth token', async () => {
      await request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });

  describe('Asset Categories', () => {
    it('should get all asset categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/assets/categories/list')
        .expect(200);

      expect(Array.isArray(response.data)).toBe(true);
      // Check for builtin categories
      const categoryNames = response.data.map((c: any) => c.name);
      expect(categoryNames).toContain('流动资产');
      expect(categoryNames).toContain('固定资产');
      expect(categoryNames).toContain('投资资产');
      expect(categoryNames).toContain('负债');
    });

    it('should create a new asset category', async () => {
      const response = await request(app.getHttpServer())
        .post('/assets/categories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试分类',
          icon: '🧪',
          color: '#00FF00',
          parentId: null,
          isBuiltin: false,
        })
        .expect(201);

      expect(response.data.name).toBe('测试分类');
      expect(response.data.icon).toBe('🧪');
    });
  });

  describe('Assets', () => {
    let assetId: string;
    let liquidCategoryId: string;

    beforeAll(async () => {
      // Get a liquid asset category ID
      const categories = await dataSource.getRepository(AssetCategory).find({
        where: { name: '银行存款' },
      });
      if (categories.length > 0) {
        liquidCategoryId = categories[0].id;
      }
    });

    it('should create a new asset', async () => {
      const response = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '测试银行账户',
          categoryId: liquidCategoryId,
          holderId: testUserId,
          initialValue: 100000,
          currentValue: 120000,
          currency: 'CNY',
          purchaseDate: '2024-01-01',
        })
        .expect(201);

      expect(response.data.name).toBe('测试银行账户');
      expect(response.data.currentValue).toBe(120000);
      assetId = response.data.id;
    });

    it('should get all assets for user', async () => {
      const response = await request(app.getHttpServer())
        .get('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should get asset by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.data.id).toBe(assetId);
      expect(response.data.name).toBe('测试银行账户');
    });

    it('should update asset', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/assets/${assetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentValue: 130000,
        })
        .expect(200);

      expect(response.data.currentValue).toBe(130000);
    });

    it('should delete asset', async () => {
      // Create a temporary asset to delete
      const createResponse = await request(app.getHttpServer())
        .post('/assets')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '待删除资产',
          categoryId: liquidCategoryId,
          holderId: testUserId,
          initialValue: 5000,
          currentValue: 5000,
          currency: 'CNY',
          purchaseDate: '2024-01-01',
        });

      const tempAssetId = createResponse.data.id;

      await request(app.getHttpServer())
        .delete(`/assets/${tempAssetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Transaction Categories', () => {
    it('should get all transaction categories', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/categories/list')
        .expect(200);

      expect(Array.isArray(response.data)).toBe(true);
      const categoryNames = response.data.map((c: any) => c.name);
      expect(categoryNames).toContain('工资');
      expect(categoryNames).toContain('餐饮');
    });

    it('should get income categories only', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/categories/list?type=income')
        .expect(200);

      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach((cat: any) => {
        expect(cat.type).toBe('income');
      });
    });

    it('should get expense categories only', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/categories/list?type=expense')
        .expect(200);

      expect(Array.isArray(response.data)).toBe(true);
      response.data.forEach((cat: any) => {
        expect(cat.type).toBe('expense');
      });
    });
  });

  describe('Transactions', () => {
    let transactionId: string;
    let incomeCategoryId: string;
    let expenseCategoryId: string;

    beforeAll(async () => {
      const incomeCats = await dataSource.getRepository(TransactionCategory).find({
        where: { type: 'income', name: '工资' },
      });
      if (incomeCats.length > 0) {
        incomeCategoryId = incomeCats[0].id;
      }

      const expenseCats = await dataSource.getRepository(TransactionCategory).find({
        where: { type: 'expense', name: '餐饮' },
      });
      if (expenseCats.length > 0) {
        expenseCategoryId = expenseCats[0].id;
      }
    });

    it('should create an income transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'income',
          amount: 15000,
          categoryId: incomeCategoryId,
          accountId: testUserId,
          memberId: testUserId,
          date: '2024-01-15',
          notes: '月度工资',
        })
        .expect(201);

      expect(response.data.type).toBe('income');
      expect(response.data.amount).toBe(15000);
      transactionId = response.data.id;
    });

    it('should create an expense transaction', async () => {
      const response = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 500,
          categoryId: expenseCategoryId,
          accountId: testUserId,
          memberId: testUserId,
          date: '2024-01-16',
          notes: '午餐',
        })
        .expect(201);

      expect(response.data.type).toBe('expense');
      expect(response.data.amount).toBe(500);
    });

    it('should get all transactions', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    });

    it('should get transaction statistics', async () => {
      const response = await request(app.getHttpServer())
        .get('/transactions/statistics')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.data).toHaveProperty('totalIncome');
      expect(response.data).toHaveProperty('totalExpense');
      expect(response.data).toHaveProperty('netIncome');
    });

    it('should get transaction by id', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.data.id).toBe(transactionId);
    });

    it('should update transaction', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/transactions/${transactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          amount: 16000,
        })
        .expect(200);

      expect(response.data.amount).toBe(16000);
    });

    it('should delete transaction', async () => {
      // Create a temporary transaction to delete
      const createResponse = await request(app.getHttpServer())
        .post('/transactions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'expense',
          amount: 100,
          categoryId: expenseCategoryId,
          accountId: testUserId,
          memberId: testUserId,
          date: '2024-01-17',
        });

      const tempTransactionId = createResponse.data.id;

      await request(app.getHttpServer())
        .delete(`/transactions/${tempTransactionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });

  describe('Users', () => {
    it('should get current user', async () => {
      const response = await request(app.getHttpServer())
        .get('/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.data.id).toBe(testUserId);
      expect(response.data.username).toBe(testUser.username);
    });

    it('should update user profile', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/users/${testUserId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          displayName: '测试用户',
        })
        .expect(200);

      expect(response.data.displayName).toBe('测试用户');
    });
  });
});
