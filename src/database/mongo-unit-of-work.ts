import { Injectable, ConflictException } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ClientSession } from 'mongoose';
import { AsyncLocalStorage } from 'async_hooks';
import { IUnitOfWork } from './unit-of-work.interface';

@Injectable()
export class MongoUnitOfWork implements IUnitOfWork {
  private readonly storage = new AsyncLocalStorage<ClientSession>();

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async withTransaction<T>(work: () => Promise<T>): Promise<T> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const result = await this.storage.run(session, work);
      await session.commitTransaction();
      return result;
    } catch (error: unknown) {
      await session.abortTransaction();
      const mongoError = error as { code?: number; hasErrorLabel?: (label: string) => boolean };
      if (mongoError?.code === 112 || mongoError?.hasErrorLabel?.('TransientTransactionError')) {
        throw new ConflictException('Concurrent update detected, please try again.');
      }
      throw error;
    } finally {
      session.endSession();
    }
  }

  getSession(): ClientSession {
    const session = this.storage.getStore();
    if (!session) {
      throw new Error('No active transaction. Ensure this code is wrapped in withTransaction()');
    }
    return session;
  }

  getSessionIfAvailable(): ClientSession | undefined {
    return this.storage.getStore();
  }
}
