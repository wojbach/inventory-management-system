export class ConsumerNotFoundException extends Error {
  constructor(public readonly consumerId: string) {
    super(`Consumer with ID ${consumerId} not found`);
    this.name = ConsumerNotFoundException.name;
  }
}
