import { CustomerLocation } from '../../common/enums/customer-location.enum';

import { PaginatedResponse } from '../../common/dto/paginated-response.dto';

export const CONSUMER_REPOSITORY_TOKEN = Symbol('ConsumerRepository');

export interface ConsumerDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  location: CustomerLocation;
  address: string;
}

export interface IConsumerRepository {
  findById(id: string): Promise<ConsumerDto | null>;
  findAll(page: number, limit: number): Promise<PaginatedResponse<ConsumerDto>>;
}

export const CONSUMER_SEED_REPOSITORY_TOKEN = Symbol('ConsumerSeedRepository');

export interface IConsumerSeedRepository {
  seed(consumers: ConsumerDto[]): Promise<void>;
  count(): Promise<number>;
}
