import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamiliesService } from './families.service';
import { FamiliesController } from './families.controller';
import { Family } from './entities/family.entity';
import { FamilyMember } from './entities/family-member.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Family, FamilyMember, User])],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
