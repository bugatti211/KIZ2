import { Product } from './product.model';

export interface Sale {
  id: number;
  date: string;
  total: number;
  items: SaleItem[];
}

export interface SaleItem {
  id: number;
  saleId: number;
  productId: number;
  quantity: number;
  price: number;
  total: number;
  product?: Product;
}

export interface CreateSaleDto {
  items: {
    productId: number;
    quantity: number;
    price: number;
  }[];
}

export interface SaleStatistics {
  totalAmount: number;
  totalSales: number;
  sales: Sale[];
}
