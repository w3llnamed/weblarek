import type { TPayment } from '../../../types/index';
import type { IBuyer } from '../../../types/index';
import { EventEmitter } from '../Events';

export class Buyer {
  private payment: TPayment | null = null;
  private address: string = '';
  private phone: string = '';
  private email: string = '';

  constructor(private readonly events: EventEmitter) {}

  public setData(data: IBuyer): void {
    this.payment = data.payment;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
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
    const data =
      this.payment === null
        ? { payment: 'card' as TPayment, address: this.address, email: this.email, phone: this.phone }
        : { payment: this.payment, address: this.address, email: this.email, phone: this.phone };

    this.events.emit('buyer:changed', { data });
  }
}
