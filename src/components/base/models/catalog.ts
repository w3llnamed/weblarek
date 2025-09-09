import type { IProduct } from '../../../types/index';

export class Catalog {
  private products: IProduct[] = [];
  private selectedProduct: IProduct | null = null;

  public setProducts(products: IProduct[]): void {
    this.products = [...products];
  }
  
  public getProducts(): IProduct[] {
    return [...this.products];
  }
  
  public getProductById(id: string): IProduct | undefined {
    return this.products.find(p => p.id === id);
  }
  
  public setProduct(product: IProduct): void {
    this.selectedProduct = product;
  }
  
  public getProduct(): IProduct | null {
    return this.selectedProduct;
  }
}