export class OrderItemResponseDto {
  productId: string;
  productName?: string;
  quantity: number;
  price: number;
}

interface CreateOrderResponseParams {
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

  static create(params: CreateOrderResponseParams): OrderResponseDto {
    const dto = new OrderResponseDto();
    dto.id = params.id;
    dto.customerId = params.customerId;
    dto.items = params.items;
    dto.total = params.total;
    dto.originalTotal = params.originalTotal;
    dto.regionalAdjustment = params.regionalAdjustment;
    dto.taxAmount = params.taxAmount;
    dto.taxRate = params.taxRate;
    dto.discountApplied = params.discountApplied;
    dto.createdAt = params.createdAt;
    dto.updatedAt = params.updatedAt;
    return dto;
  }
}
