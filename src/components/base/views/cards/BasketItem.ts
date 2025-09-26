import { BaseCard, CardHandlers, CardViewData } from './BaseCard';

/**
 * Позиция корзины — шаблон #card-basket
 * <li class="basket__item card card_compact">…</li>
 */
export class BasketItem extends BaseCard {
  protected rootItem: HTMLLIElement;
  protected indexEl: HTMLElement;
  protected deleteButton: HTMLButtonElement;

  constructor(node: HTMLElement, handlers: Pick<CardHandlers, 'onRemove'> = {}) {
    super(node, handlers);

    // Корень конкретного шаблона — <li>
    this.rootItem = node as HTMLLIElement;

    // Обязательные элементы из шаблона
    const indexEl = node.querySelector<HTMLElement>('.basket__item-index');
    const deleteBtn = node.querySelector<HTMLButtonElement>('.basket__item-delete');

    if (!indexEl || !deleteBtn) {
      throw new Error('BasketItem: не найдены .basket__item-index или .basket__item-delete');
    }

    this.indexEl = indexEl;
    this.deleteButton = deleteBtn;

    // Клик по «удалить»
    this.deleteButton.addEventListener('click', () => this.emitRemove());
  }

  /** Устанавливает порядковый номер позиции */
  setIndex(n: number): void {
    this.indexEl.textContent = String(n);
  }

  /**
   * Просто прокидываем в базовый render.
   * Если price === null — BaseCard уже пишет «Бесценно».
   */
  render(data?: Partial<CardViewData>): HTMLElement {
    return super.render(data);
  }
}
