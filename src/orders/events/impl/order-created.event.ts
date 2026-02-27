export class OrderCreatedEvent {
  constructor(
    public readonly id: string,
    public readonly customerId: string,
    public readonly items: {
      productId: string;
      quantity: number;
      price: number;
    }[],
    public readonly total: number,
    public readonly originalTotal: number,
    public readonly regionalAdjustment: number,
    public readonly taxAmount: number,
    public readonly taxRate: number,
    public readonly discountApplied: string,
  ) {}
}
