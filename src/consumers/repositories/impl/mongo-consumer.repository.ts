import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConsumerDocument } from './consumer.schema';
import { IConsumerRepository, ConsumerDto } from '../consumer-repository.interface';
import { PaginatedResponse } from '../../../common/dto/paginated-response.dto';

@Injectable()
export class MongoConsumerRepository implements IConsumerRepository {
  constructor(
    @InjectModel(ConsumerDocument.name)
    private readonly model: Model<ConsumerDocument>,
  ) {}

  async findById(id: string): Promise<ConsumerDto | null> {
    const doc = await this.model.findById(id).lean().exec();
    if (!doc) return null;
    return {
      id: doc._id.toString(),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      location: doc.location,
      address: doc.address,
    };
  }

  async findAll(page: number, limit: number): Promise<PaginatedResponse<ConsumerDto>> {
    const skip = (page - 1) * limit;

    const [docs, total] = await Promise.all([this.model.find().skip(skip).limit(limit).lean().exec(), this.model.countDocuments().exec()]);

    const data = docs.map((doc) => ({
      id: doc._id.toString(),
      email: doc.email,
      firstName: doc.firstName,
      lastName: doc.lastName,
      location: doc.location,
      address: doc.address,
    }));

    return { data, total, page, limit };
  }

  async count(): Promise<number> {
    return this.model.countDocuments().exec();
  }

  async seed(consumers: ConsumerDto[]): Promise<void> {
    const documents = consumers.map((c) => ({
      _id: c.id,
      email: c.email,
      firstName: c.firstName,
      lastName: c.lastName,
      location: c.location,
      address: c.address,
    }));
    await this.model.insertMany(documents);
  }
}
