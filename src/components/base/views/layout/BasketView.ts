import { Component } from '../../Component';

type BasketHandlers = {
  onCheckout?(): void;
};

export class BasketView extends Component {
  private listEl: HTMLUListElement;
  private totalEl: HTMLElement;
  private checkoutBtn: HTMLButtonElement;
  private emptyEl: HTMLElement;
  private handlers: BasketHandlers;

  constructor(root: HTMLElement, handlers: BasketHandlers = {}) {
    super(root);
    this.handlers = handlers;

    this.listEl = root.querySelector('.basket__list') as HTMLUListElement;
    this.totalEl = root.querySelector('.basket__price') as HTMLElement;
    this.checkoutBtn = root.querySelector('.basket__button') as HTMLButtonElement;

    // «Корзина пуста»
    this.emptyEl = document.createElement('li');
    this.emptyEl.textContent = 'Корзина пуста';
    this.emptyEl.className = 'basket__empty';

    // один раз навешиваем слушатель
    this.checkoutBtn.addEventListener('click', () => {
      this.handlers.onCheckout?.();
    });
  }

  /** вернуть корневой элемент */
  render(): HTMLElement {
    return this.container;
  }

  /** отрисовать список позиций */
  setItems(nodes: HTMLElement[]): void {
    this.listEl.replaceChildren(...nodes);
  }

  /** обновить сумму */
  setTotal(value: number): void {
    this.totalEl.textContent = `${value} синапсов`;
  }

  /** активировать/деактивировать «Оформить» */
  setSubmitDisabled(flag: boolean): void {
    this.checkoutBtn.disabled = flag;
  }

  /** пустое состояние списка */
  setEmpty(flag: boolean): void {
    if (flag) {
      this.listEl.replaceChildren(this.emptyEl);
      this.setSubmitDisabled(true);
      this.setTotal(0);
    }
  }
}
