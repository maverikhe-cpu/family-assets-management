import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SeedService } from './common/services/seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const seedService = app.get(SeedService);
  await seedService.seed();

  await app.close();
  console.log('✅ Database seeded successfully!');
}

bootstrap().catch((error) => {
  console.error('❌ Seeding failed:', error);
  process.exit(1);
});
