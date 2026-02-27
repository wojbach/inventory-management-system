import { ClientSession } from 'mongoose';

export const UNIT_OF_WORK_TOKEN = 'IUnitOfWork';

export interface IUnitOfWork {
  withTransaction<T>(work: () => Promise<T>): Promise<T>;
  getSession(): ClientSession;
  getSessionIfAvailable(): ClientSession | undefined;
}
