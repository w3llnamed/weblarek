import { BaseCard, CardHandlers, CardViewData } from './BaseCard';

/**
 * Карточка каталога (плитка) — шаблон #card-catalog
 * Корень шаблона — <button class="gallery__item card">…</button>
 */
export class CatalogCard extends BaseCard {
  protected rootButton: HTMLButtonElement;

  constructor(node: HTMLElement, handlers: Pick<CardHandlers, 'onSelect'> = {}) {
    super(node, handlers);

    // корень карточки — это кнопка
    this.rootButton = node as HTMLButtonElement;

    // клик по плитке -> выбрать карточку
    this.rootButton.addEventListener('click', () => this.emitSelect());
  }

  /** Ничего не переизобретаем: вызываем базовый render и донастраиваем доступность плитки */
  render(data?: Partial<CardViewData>): HTMLElement {
    const el = super.render(data);

    // управляем кликабельностью плитки в зависимости от цены
    if (data && 'price' in data) {
      if (data.price === null) {
        this.priceEl.textContent = 'Бесценно';
      } else {
        this.rootButton.disabled = false;
      }
    }

    return el;
  }
}
