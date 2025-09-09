import type { TPayment } from '../../../types/index';
import type { IBuyer } from '../../../types/index'


export class Buyer {
  private payment: TPayment | null = null;
  private address: string = '';
  private phone: string = '';
  private email: string = '';

  public setData(data: IBuyer): void {
    this.payment = data.payment;
    this.address = data.address;
    this.phone = data.phone;
    this.email = data.email;
  }

  public getData(): IBuyer {
    if (this.payment === null) {
      throw new Error ('Тип оплаты не определён!')
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
  }

  public checkData(): boolean {
    const paymentOk: boolean = this.payment != null;
    const addressOk: boolean = this.address != '';
    const phoneOk: boolean = this.phone != '';
    const emailOk: boolean = this.email != '';

    return paymentOk && addressOk && phoneOk && emailOk
  }
}