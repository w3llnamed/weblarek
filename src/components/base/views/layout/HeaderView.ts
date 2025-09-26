import { Component } from '../../Component';

export type HeaderHandlers = {
  onOpenBasket?(): void;
};

export class HeaderView extends Component<null> {
  private handlers: HeaderHandlers;

  private basketButton: HTMLButtonElement;
  private counterEl: HTMLElement;

  constructor(root: HTMLElement, handlers: HeaderHandlers = {}) {
    super(root);
    this.handlers = handlers;

    this.basketButton = root.querySelector<HTMLButtonElement>('.header__basket')!;
    this.counterEl = root.querySelector<HTMLElement>('.header__basket-counter')!;

    // один раз навешиваем обработчик
    this.basketButton.addEventListener('click', () => {
      this.handlers.onOpenBasket?.();
    });
  }

  /** Установить число товаров в бейдж */
  public setBadge(count: number): void {
    this.counterEl.textContent = String(count);
  }

  /** Вернуть корневой элемент */
  public render(): HTMLElement {
    return this.container;
  }
}
