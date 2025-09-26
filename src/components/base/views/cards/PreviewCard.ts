import { BaseCard, CardHandlers, CardViewData } from './BaseCard';

/**
 * Детальная карточка товара — шаблон #card-preview (рендерится в модалке)
 * Показывает: картинку, категорию, название, описание, цену и основную кнопку действия.
 */
export class PreviewCard extends BaseCard {
  protected textEl?: HTMLElement;
  private inCart = false;

  constructor(
    node: HTMLElement,
    handlers: Pick<CardHandlers, 'onAdd' | 'onRemove'> = {}
  ) {
    super(node, handlers);

    // специфичный для превью элемент с описанием
    this.textEl = node.querySelector<HTMLElement>('.card__text') ?? undefined;

    // основная кнопка действия
    if (this.actionButton) {
      this.actionButton.addEventListener('click', () => {
        if (this.actionButton!.disabled) return;
        this.inCart ? this.emitRemove() : this.emitAdd();
      });
    }
  }

  /**
   * Рендер базовых полей через BaseCard и доп. — описания.
   * Также синхронизируем состояние кнопки, если изменилась цена.
   */
  render(
    data?: Partial<CardViewData> & { description?: string }
  ): HTMLElement {
    const el = super.render(data);

    if (data && 'description' in data && this.textEl) {
      this.textEl.textContent = data.description ?? '';
    }

    // если пришла цена — пересчитаем доступность кнопки
    if (this.actionButton && data && 'price' in data) {
      if (data.price === null) {
        this.actionButton.disabled = true;
        this.actionButton.textContent = 'Недоступно';
      } else {
        this.actionButton.disabled = false;
        // вернуть текст в соответствие текущему состоянию корзины
        this.updateActionButtonText();
      }
    } else {
      // на всякий случай держим текст в актуальном состоянии
      this.updateActionButtonText();
    }

    return el;
  }

  /** Переключает режим «в корзине» <-> «не в корзине» и меняет текст кнопки */
  setInCart(flag: boolean): void {
    this.inCart = flag;
    this.updateActionButtonText();
  }

  /** Локальный помощник для текста кнопки */
  private updateActionButtonText(): void {
    if (!this.actionButton) return;
    if (this.actionButton.disabled) return; // при цене null не трогаем «Недоступно»
    this.actionButton.textContent = this.inCart ? 'Удалить из корзины' : 'В корзину';
  }
}
