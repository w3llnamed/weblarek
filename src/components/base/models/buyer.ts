import type { TPayment } from '../../../types/index';
import type { IBuyer } from '../../../types/index';
import { EventEmitter } from '../Events';

export class Buyer {
  private payment: TPayment | null = null;
  private address: string = '';
  private phone: string = '';
  private email: string = '';

  constructor(private readonly events: EventEmitter) {}

  public setData(next: Partial<IBuyer>): void {
    if (next.payment !== undefined) this.payment = next.payment;
    if (next.address !== undefined) this.address = next.address;
    if (next.phone   !== undefined) this.phone   = next.phone;
    if (next.email   !== undefined) this.email   = next.email;
    this.emitChanged();
  }


  public getData(): IBuyer {
    if (this.payment === null) {
      throw new Error('Тип оплаты не определён!');
    }
    return {
      payment: this.payment,
      address: this.address,
      email: this.email,
      phone: this.phone,
    };
  }

  public clearData(): void {
    this.payment = null;
    this.address = '';
    this.phone = '';
    this.email = '';
    this.emitChanged();
  }

  public checkData(): boolean {
    const paymentOk = this.payment != null;
    const addressOk = this.address !== '';
    const phoneOk = this.phone !== '';
    const emailOk = this.email !== '';
    return paymentOk && addressOk && phoneOk && emailOk;
  }

  private emitChanged(): void {
  // шлём «как есть» (частичные данные допустимы для валидации на форме)
  this.events.emit('buyer:changed', {
    data: {
      payment: this.payment as any, // может быть null — валидатор учтёт
      address: this.address,
      email:   this.email,
      phone:   this.phone,
    }
  });
}
}
