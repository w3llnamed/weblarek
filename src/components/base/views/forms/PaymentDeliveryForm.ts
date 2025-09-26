import { BaseForm, FormHandlers } from './BaseForm';

export type PaymentType = 'card' | 'cash';
export type PaymentDeliveryState = { payment: PaymentType | ''; address: string };

const ACTIVE_CLASS = 'button_alt-active';

export class PaymentDeliveryForm extends BaseForm<PaymentDeliveryState> {
  protected cardBtn: HTMLButtonElement;
  protected cashBtn: HTMLButtonElement;
  protected addressInput: HTMLInputElement;

  constructor(form: HTMLFormElement, handlers: FormHandlers<PaymentDeliveryState> = {}) {
    super(form, handlers);

    const card = form.querySelector<HTMLButtonElement>('button[name="card"].button_alt');
    const cash = form.querySelector<HTMLButtonElement>('button[name="cash"].button_alt');
    const address = form.querySelector<HTMLInputElement>('input[name="address"]');

    if (!card || !cash || !address) {
      throw new Error('PaymentDeliveryForm: не найдены элементы формы (card/cash/address).');
    }

    this.cardBtn = card;
    this.cashBtn = cash;
    this.addressInput = address;

    // Тоггл способа оплаты
    this.cardBtn.addEventListener('click', () => {
      this.setPayment('card');
      this.handlers.onChange?.(this.readFormState());
    });

    this.cashBtn.addEventListener('click', () => {
      this.setPayment('cash');
      this.handlers.onChange?.(this.readFormState());
    });
  }

  /** ГАРАНТИРОВАННОЕ чтение состояния формы шага 1 */
  protected readFormState(): PaymentDeliveryState {
    const payment: PaymentDeliveryState['payment'] =
      this.cardBtn.classList.contains(ACTIVE_CLASS) ? 'card' :
      this.cashBtn.classList.contains(ACTIVE_CLASS) ? 'cash' : '';

    return {
      payment,
      address: this.addressInput.value.trim(),
    };
  }

  /** Установить активный способ оплаты и подсветку */
  setPayment(p: PaymentType): void {
    this.cardBtn.classList.toggle(ACTIVE_CLASS, p === 'card');
    this.cashBtn.classList.toggle(ACTIVE_CLASS, p === 'cash');
  }

  /** Подставить адрес */
  setAddress(value: string): void {
    this.addressInput.value = value ?? '';
  }

  /** Разрешаем проставлять значения через render(data) */
  render(data?: Partial<PaymentDeliveryState>): HTMLElement {
    if (data?.payment) this.setPayment(data.payment as PaymentType);
    if (data?.address !== undefined) this.setAddress(data.address ?? '');
    return super.render(data);
  }
}
