export class SellProductCommand {
  constructor(
    public readonly id: string,
    public readonly amount: number,
  ) {}
}
