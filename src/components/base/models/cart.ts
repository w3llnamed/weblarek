import type { IProduct } from '../../../types/index'

export class Cart {
  private products: IProduct[] = [];

  public getProducts(): IProduct[] {
    return [...this.products];
  }
  
  public addProduct(product: IProduct): void {
    this.products.push(product);
  }
  
  public deleteProduct(product: IProduct): void {
    this.products = this.products.filter(p => p.id !== product.id)
  }
  
  public clear(): void {
    this.products = [];
  }
  
  public getSum(): number {
    return this.products.reduce((sum, p) => sum + (p.price ?? 0),0);
  }
  
  public getCount(): number {
    return this.products.length;
  }
  
  public hasProduct(id: string): boolean {
    return this.products.some(p => p.id === id);
  }
}