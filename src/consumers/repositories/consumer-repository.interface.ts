import { CustomerLocation } from '../../orders/enums/customer-location.enum';

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
  seed(consumers: ConsumerDto[]): Promise<void>;
  count(): Promise<number>;
}
