export class ProductRestockedEvent {
  constructor(
    public readonly id: string,
    public readonly amount: number,
  ) {}
}
