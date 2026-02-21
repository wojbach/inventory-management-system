export class InsufficientStockException extends Error {
  constructor(
    public readonly productId: string,
    public readonly currentStock: number,
    public readonly requestedAmount: number,
  ) {
    super(
      `Insufficient stock for product ${productId}. Available: ${currentStock}, Requested: ${requestedAmount}`,
    );
    this.name = InsufficientStockException.name;
  }
}
