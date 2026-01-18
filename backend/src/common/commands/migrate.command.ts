import { Command, Console } from 'nestjs-console';
import { FamilyInitService } from '../../families/family-init.service';

@Console()
export class MigrateCommand {
  constructor(private readonly familyInitService: FamilyInitService) {}

  @Command({
    command: 'migrate:init-users',
    description: 'Create default families for all users without a family',
  })
  async initUsers() {
    await this.familyInitService.initializeAllUsers();
    console.log('✅ All users have been initialized with families');
  }

  @Command({
    command: 'migrate:orphan-data',
    description: 'Migrate all orphan data (assets/transactions without familyId) to their owner family',
  })
  async migrateOrphanData() {
    await this.familyInitService.migrateAllOrphanData();
    console.log('✅ All orphan data has been migrated');
  }

  @Command({
    command: 'migrate:user <userId>',
    description: 'Create a default family for a specific user and migrate their data',
  })
  async migrateUser(userId: string) {
    await this.familyInitService.migrateUserDataToFamily(userId);
    console.log(`✅ User ${userId} has been migrated to their family`);
  }

  @Command({
    command: 'migrate:all',
    description: 'Run full migration: init users and migrate orphan data',
  })
  async migrateAll() {
    console.log('Starting full migration...');
    await this.familyInitService.initializeAllUsers();
    await this.familyInitService.migrateAllOrphanData();
    console.log('✅ Full migration completed');
  }
}
