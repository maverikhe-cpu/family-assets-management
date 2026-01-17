import { Command, Console } from 'nestjs-console';
import { SeedService } from '../services/seed.service';

@Console()
export class SeedCommand {
  constructor(private readonly seedService: SeedService) {}

  @Command({
    command: 'seed',
    description: 'Seed the database with initial data',
  })
  async create() {
    await this.seedService.seed();
  }
}
