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

    this.addressInput.addEventListener('input', () => {
      this.handlers.onChange?.(this.getValues());
    });


    // Тоггл способа оплаты — только классы, без хранения данных
    this.cardBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.setPayment('card');
      this.handlers.onChange?.(this.getValues());
    });

    this.cashBtn.addEventListener('click', (e) => {
      e.preventDefault();
      this.setPayment('cash');
      this.handlers.onChange?.(this.getValues());
    });
  }

  /** Снимок значений шага 1 из DOM */
  protected getValues(): PaymentDeliveryState {
    const payment: PaymentDeliveryState['payment'] =
      this.cardBtn.classList.contains(ACTIVE_CLASS) ? 'card' :
      this.cashBtn.classList.contains(ACTIVE_CLASS) ? 'cash' : '';

    return {
      payment,
      address: this.addressInput.value.trim(),
    };
  }

  /** Подсветка выбранного метода оплаты */
  setPayment(p: PaymentType | ''): void {
    this.cardBtn.classList.toggle(ACTIVE_CLASS, p === 'card');
    this.cashBtn.classList.toggle(ACTIVE_CLASS, p === 'cash');
  }

  setAddress(value: string): void {
    this.addressInput.value = value ?? '';
  }

  render(data?: Partial<PaymentDeliveryState>): HTMLElement {
    if (data?.payment !== undefined) this.setPayment(data.payment ?? '');
    if (data?.address !== undefined) this.setAddress(data.address ?? '');
    return super.render(); // без data
  }
}
