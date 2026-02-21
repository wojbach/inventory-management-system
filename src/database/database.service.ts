import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onApplicationBootstrap() {
    this.logger.log('Testing database connection...');
    try {
      await this.connection.asPromise();

      if (this.connection.db) {
        await this.connection.db.admin().ping();
      }

      this.logger.log('Database connection successful!');
    } catch (error) {
      this.logger.error('Failed to connect to the database', error instanceof Error ? error.stack : String(error));
      process.exit(1);
    }
  }
}
