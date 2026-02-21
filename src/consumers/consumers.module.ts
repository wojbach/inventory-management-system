import { Module, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { MongooseModule } from '@nestjs/mongoose';
import * as crypto from 'crypto';
import { ConsumersController } from './consumers.controller';
import { ConsumerDocument, ConsumerSchema } from './repositories/impl/consumer.schema';
import { MongoConsumerRepository } from './repositories/impl/mongo-consumer.repository';
import { CONSUMER_REPOSITORY_TOKEN, IConsumerRepository } from './repositories/consumer-repository.interface';
import { GetConsumersHandler } from './queries/handlers/get-consumers.handler';
import { CustomerLocation } from '../orders/enums/customer-location.enum';

const CommandHandlers = [];
const QueryHandlers = [GetConsumersHandler];
const EventHandlers = [];

@Module({
  imports: [CqrsModule, MongooseModule.forFeature([{ name: ConsumerDocument.name, schema: ConsumerSchema }])],
  controllers: [ConsumersController],
  providers: [
    {
      provide: CONSUMER_REPOSITORY_TOKEN,
      useClass: MongoConsumerRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
    ...EventHandlers,
  ],
  exports: [CONSUMER_REPOSITORY_TOKEN],
})
export class ConsumersModule implements OnApplicationBootstrap {
  constructor(
    @Inject(CONSUMER_REPOSITORY_TOKEN)
    private readonly consumerRepository: IConsumerRepository,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.consumerRepository.count();
    if (count === 0) {
      console.log('Seeding initial Consumers data...');
      await this.consumerRepository.seed([
        {
          id: crypto.randomUUID(),
          email: 'alice.smith@example.com',
          firstName: 'Alice',
          lastName: 'Smith',
          location: CustomerLocation.US,
          address: '123 Fake St, New York, NY 10001',
        },
        {
          id: crypto.randomUUID(),
          email: 'bob.jones@example.com',
          firstName: 'Bob',
          lastName: 'Jones',
          location: CustomerLocation.EUROPE,
          address: '45 Trafalgar Sq, London, UK',
        },
        {
          id: crypto.randomUUID(),
          email: 'charlie.brown@example.com',
          firstName: 'Charlie',
          lastName: 'Brown',
          location: CustomerLocation.ASIA,
          address: '789 Sushi Blvd, Tokyo, JP',
        },
        {
          id: crypto.randomUUID(),
          email: 'dan.evans@example.com',
          firstName: 'Dan',
          lastName: 'Evans',
          location: CustomerLocation.US,
          address: '55 Rodeo Dr, Beverly Hills, CA 90210',
        },
        {
          id: crypto.randomUUID(),
          email: 'eve.adams@example.com',
          firstName: 'Eve',
          lastName: 'Adams',
          location: CustomerLocation.EUROPE,
          address: '10 Rue de Rivoli, Paris, FR',
        },
      ]);
      console.log('Consumers successfully seeded!');
    }
  }
}
