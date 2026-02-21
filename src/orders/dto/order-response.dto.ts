export class OrderItemResponseDto {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
}

export class OrderResponseDto {
  id: string;
  customerId: string;
  items: OrderItemResponseDto[];
  total: number;
  originalTotal: number;
  regionalAdjustment: number;
  taxAmount: number;
  taxRate: number;
  discountApplied: string;
  createdAt?: string;
  updatedAt?: string;

  static create(primitive: Partial<OrderResponseDto>): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = primitive.id ?? '';
    dto.customerId = primitive.customerId ?? '';
    dto.items = primitive.items ?? [];
    dto.total = primitive.total ?? 0;
    dto.originalTotal = primitive.originalTotal ?? 0;
    dto.regionalAdjustment = primitive.regionalAdjustment ?? 0;
    dto.taxAmount = primitive.taxAmount ?? 0;
    dto.taxRate = primitive.taxRate ?? 0;
    dto.discountApplied = primitive.discountApplied ?? '';
    dto.createdAt = primitive.createdAt ?? '';
    dto.updatedAt = primitive.updatedAt ?? '';
    return dto;
  }
}
