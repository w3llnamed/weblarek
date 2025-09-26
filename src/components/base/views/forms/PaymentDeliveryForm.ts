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

    // Обязательные элементы
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

  /** Установить активный способ оплаты и подсветку */
  setPayment(p: PaymentType): void {
    this.cardBtn.classList.toggle(ACTIVE_CLASS, p === 'card');
    this.cashBtn.classList.toggle(ACTIVE_CLASS, p === 'cash');
    // Вписываем значение в скрытое «состояние» формы через inputs Map (под именем "payment")
    // Если поля payment в разметке нет — создадим временно на лету и кэшируем.
    if (!this.inputs.has('payment')) {
      const hidden = document.createElement('input');
      hidden.type = 'hidden';
      hidden.name = 'payment';
      this.container.appendChild(hidden);
      this.inputs.set('payment', hidden);
    }
    const paymentInput = this.inputs.get('payment') as HTMLInputElement;
    paymentInput.value = p;
  }

  /** Подставить адрес */
  setAddress(value: string): void {
    this.addressInput.value = value;
  }

  // Переопределим render, чтобы можно было проставлять payment/address из data
  render(data?: Partial<PaymentDeliveryState>): HTMLElement {
    if (data?.payment) this.setPayment(data.payment as PaymentType);
    if (data?.address !== undefined) this.setAddress(data.address);
    return super.render(data);
  }
}
