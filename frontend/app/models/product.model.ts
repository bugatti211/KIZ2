export interface Product {
  id: number;
  name: string;
  categoryId: number;
  description: string;
  recommendations: string;
  price: number;
  stock: number;
  active: boolean;
  userId: number;
  category?: {
    id: number;
    name: string;
  };
}

export type CreateProductDto = Omit<Product, 'id' | 'userId'>;
export type UpdateProductDto = Partial<CreateProductDto>;

// Create a default export with proper type definition
const ProductModule = {
    Product: {} as Product
};
export default ProductModule;
