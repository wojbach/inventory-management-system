export class ProductSoldEvent {
  constructor(
    public readonly id: string,
    public readonly amount: number,
  ) {}
}
