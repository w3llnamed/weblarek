import type { IProduct } from '../../../types/index';
import { EventEmitter } from '../Events';

export class Catalog {
  private products: IProduct[] = [];
  private selectedProduct: IProduct | null = null;

  constructor(private readonly events: EventEmitter) {} // <-- добавили

  public setProducts(products: IProduct[]): void {
    this.products = [...products];
    this.events.emit('catalog:changed', { items: this.products });
  }
  
  public getProducts(): IProduct[] {
    return [...this.products];
  }
  
  public getProductById(id: string): IProduct | undefined {
    return this.products.find(p => p.id === id);
  }
  
  public setProduct(product: IProduct | null): void {
    this.selectedProduct = product;
    this.events.emit('viewer:changed', { item: this.selectedProduct });
  }
  
  public getProduct(): IProduct | null {
    return this.selectedProduct;
  }
}