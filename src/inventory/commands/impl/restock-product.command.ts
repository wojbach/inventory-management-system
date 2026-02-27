export class RestockProductCommand {
  constructor(
    public readonly id: string,
    public readonly amount: number,
  ) {}
}
