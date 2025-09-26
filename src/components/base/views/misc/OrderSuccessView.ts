import { Component } from '../../Component';

export type OrderSuccessHandlers = {
  onClose?(): void;
};

type OrderSuccessData = {
  amount?: number;
};

export class OrderSuccessView extends Component<OrderSuccessData> {
  private handlers: OrderSuccessHandlers;

  private titleEl: HTMLElement;
  private descEl: HTMLElement;
  private closeBtn: HTMLButtonElement;

  constructor(node: HTMLElement, handlers: OrderSuccessHandlers = {}) {
    super(node);
    this.handlers = handlers;

    this.titleEl = node.querySelector<HTMLElement>('.order-success__title')!;
    this.descEl = node.querySelector<HTMLElement>('.order-success__description')!;
    this.closeBtn = node.querySelector<HTMLButtonElement>('.order-success__close')!;

    this.closeBtn.addEventListener('click', () => {
      this.handlers.onClose?.();
    });
  }

  /** Обновить сумму списания (если передана) */
  public setAmount(amount?: number) {
    if (typeof amount === 'number') {
      this.descEl.textContent = `Списано ${amount} синапсов`;
    }
  }

  /** Вернуть корень; при передаче данных обновляет текст */
  public render(data?: OrderSuccessData): HTMLElement {
    if (data) this.setAmount(data.amount);
    return this.container;
  }
}
