import type { IProduct } from '../../../types/index'
import { EventEmitter } from '../Events'; 

export class Cart {
  private products: IProduct[] = [];

  constructor(private readonly events: EventEmitter) {}

  public getProducts(): IProduct[] {
    return [...this.products];
  }

  public addProduct(product: IProduct): void {
    this.products.push(product);
    this.emitChanged();
  }

  public deleteProduct(product: IProduct): void {
    const before = this.products.length;
    this.products = this.products.filter((p) => p.id !== product.id);
    if (this.products.length !== before) this.emitChanged();
  }

  public clear(): void {
    if (this.products.length) {
      this.products = [];
      this.emitChanged();
    }
  }

  public getSum(): number {
    return this.products.reduce((sum, p) => sum + (p.price ?? 0), 0);
  }

  public getCount(): number {
    return this.products.length;
  }

  public hasProduct(id: string): boolean {
    return this.products.some((p) => p.id === id);
  }

  private emitChanged(): void {
    this.events.emit('basket:changed', {
      items: this.getProducts(),
      total: this.getSum(),
    });
  }
}
